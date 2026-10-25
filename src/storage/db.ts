import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { z } from 'zod';
import {
  AttemptSchema,
  ChordChangeRecordSchema,
  LessonProgressSchema,
  PlanDaySchema,
  PracticeEntrySchema,
  ProfileSchema,
  SettingsSchema,
  SkillStateSchema,
  emptyData,
  type AppData,
  type Attempt,
  type ChordChangeRecord,
  type LessonProgress,
  type PlanDay,
  type PracticeEntry,
  type Profile,
  type Settings,
  type SkillState,
} from './schema';

export const DB_NAME = 'braco-guitarra';
export const DB_VERSION = 1;

interface BracoDB extends DBSchema {
  meta: { key: string; value: unknown };
  lessons: { key: string; value: LessonProgress };
  skills: { key: string; value: SkillState };
  attempts: { key: string; value: Attempt };
  practice: { key: string; value: PracticeEntry };
  chordChanges: { key: string; value: ChordChangeRecord };
  planDays: { key: string; value: PlanDay };
}

type ListStore = 'lessons' | 'skills' | 'attempts' | 'practice' | 'chordChanges' | 'planDays';

export interface LoadResult {
  data: AppData;
  /** Records that failed validation and were ignored (kept on disk, never deleted silently). */
  invalidRecords: number;
}

/** Persistence port used by the UI. Two adapters: IndexedDB and in-memory (fallback/tests). */
export interface AppStorage {
  readonly kind: 'indexeddb' | 'memory';
  loadAll(): Promise<LoadResult>;
  saveProfile(p: Profile): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  putLesson(l: LessonProgress): Promise<void>;
  deleteLesson(lessonId: string): Promise<void>;
  putSkill(s: SkillState): Promise<void>;
  addAttempt(a: Attempt): Promise<void>;
  addPractice(p: PracticeEntry): Promise<void>;
  addChordChange(c: ChordChangeRecord): Promise<void>;
  putPlanDay(p: PlanDay): Promise<void>;
  /** Atomically replaces everything (used by import). */
  replaceAll(data: AppData): Promise<void>;
  clearAll(): Promise<void>;
}

function validateList<T>(schema: z.ZodType<T>, raw: unknown[]): { valid: T[]; invalid: number } {
  const valid: T[] = [];
  let invalid = 0;
  for (const r of raw) {
    const parsed = schema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else invalid++;
  }
  return { valid, invalid };
}

const LIST_STORES: readonly ListStore[] = ['lessons', 'skills', 'attempts', 'practice', 'chordChanges', 'planDays'];

export class IndexedDbStorage implements AppStorage {
  readonly kind = 'indexeddb' as const;
  private constructor(private readonly db: IDBPDatabase<BracoDB>) {}

  static async open(name = DB_NAME): Promise<IndexedDbStorage> {
    const db = await openDB<BracoDB>(name, DB_VERSION, {
      upgrade(database, oldVersion) {
        // Incremental migrations: add a new `if (oldVersion < N)` block per schema change.
        if (oldVersion < 1) {
          database.createObjectStore('meta');
          database.createObjectStore('lessons', { keyPath: 'lessonId' });
          database.createObjectStore('skills', { keyPath: 'skillId' });
          database.createObjectStore('attempts', { keyPath: 'id' });
          database.createObjectStore('practice', { keyPath: 'id' });
          database.createObjectStore('chordChanges', { keyPath: 'id' });
          database.createObjectStore('planDays', { keyPath: 'day' });
        }
      },
      blocking() {
        // Another tab wants a newer version: close so it can upgrade.
        db.close();
      },
    });
    return new IndexedDbStorage(db);
  }

  close(): void {
    this.db.close();
  }

  async loadAll(): Promise<LoadResult> {
    const tx = this.db.transaction(['meta', ...LIST_STORES], 'readonly');
    const [rawProfile, rawSettings, ...lists] = await Promise.all([
      tx.objectStore('meta').get('profile'),
      tx.objectStore('meta').get('settings'),
      ...LIST_STORES.map((s) => tx.objectStore(s).getAll() as Promise<unknown[]>),
    ]);
    await tx.done;
    let invalid = 0;
    const data = emptyData();

    if (rawProfile !== undefined) {
      const p = ProfileSchema.safeParse(rawProfile);
      if (p.success) data.profile = p.data;
      else invalid++;
    }
    if (rawSettings !== undefined) {
      const s = SettingsSchema.safeParse(rawSettings);
      if (s.success) data.settings = s.data;
      else invalid++;
    }
    const [lessons, skills, attempts, practice, chordChanges, planDays] = lists as unknown[][];
    const results = [
      validateList(LessonProgressSchema, lessons ?? []),
      validateList(SkillStateSchema, skills ?? []),
      validateList(AttemptSchema, attempts ?? []),
      validateList(PracticeEntrySchema, practice ?? []),
      validateList(ChordChangeRecordSchema, chordChanges ?? []),
      validateList(PlanDaySchema, planDays ?? []),
    ] as const;
    data.lessons = results[0].valid;
    data.skills = results[1].valid;
    data.attempts = results[2].valid;
    data.practice = results[3].valid;
    data.chordChanges = results[4].valid;
    data.planDays = results[5].valid;
    invalid += results.reduce((n, r) => n + r.invalid, 0);
    return { data, invalidRecords: invalid };
  }

  async saveProfile(p: Profile): Promise<void> {
    await this.db.put('meta', ProfileSchema.parse(p), 'profile');
  }
  async saveSettings(s: Settings): Promise<void> {
    await this.db.put('meta', SettingsSchema.parse(s), 'settings');
  }
  async putLesson(l: LessonProgress): Promise<void> {
    await this.db.put('lessons', LessonProgressSchema.parse(l));
  }
  async deleteLesson(lessonId: string): Promise<void> {
    await this.db.delete('lessons', lessonId);
  }
  async putSkill(s: SkillState): Promise<void> {
    await this.db.put('skills', SkillStateSchema.parse(s));
  }
  async addAttempt(a: Attempt): Promise<void> {
    await this.db.put('attempts', AttemptSchema.parse(a));
  }
  async addPractice(p: PracticeEntry): Promise<void> {
    await this.db.put('practice', PracticeEntrySchema.parse(p));
  }
  async addChordChange(c: ChordChangeRecord): Promise<void> {
    await this.db.put('chordChanges', ChordChangeRecordSchema.parse(c));
  }
  async putPlanDay(p: PlanDay): Promise<void> {
    await this.db.put('planDays', PlanDaySchema.parse(p));
  }

  async replaceAll(data: AppData): Promise<void> {
    // Single readwrite transaction: if any put fails the whole import is rolled back.
    const tx = this.db.transaction(['meta', ...LIST_STORES], 'readwrite');
    await Promise.all([tx.objectStore('meta').clear(), ...LIST_STORES.map((s) => tx.objectStore(s).clear())]);
    const ops: Promise<unknown>[] = [];
    if (data.profile) ops.push(tx.objectStore('meta').put(data.profile, 'profile'));
    if (data.settings) ops.push(tx.objectStore('meta').put(data.settings, 'settings'));
    for (const l of data.lessons) ops.push(tx.objectStore('lessons').put(l));
    for (const s of data.skills) ops.push(tx.objectStore('skills').put(s));
    for (const a of data.attempts) ops.push(tx.objectStore('attempts').put(a));
    for (const p of data.practice) ops.push(tx.objectStore('practice').put(p));
    for (const c of data.chordChanges) ops.push(tx.objectStore('chordChanges').put(c));
    for (const d of data.planDays) ops.push(tx.objectStore('planDays').put(d));
    await Promise.all([...ops, tx.done]);
  }

  async clearAll(): Promise<void> {
    const tx = this.db.transaction(['meta', ...LIST_STORES], 'readwrite');
    await Promise.all([tx.objectStore('meta').clear(), ...LIST_STORES.map((s) => tx.objectStore(s).clear()), tx.done]);
  }
}

/** Non-persistent fallback when IndexedDB is unavailable. The UI warns the user loudly. */
export class MemoryStorage implements AppStorage {
  readonly kind = 'memory' as const;
  private data: AppData = emptyData();

  async loadAll(): Promise<LoadResult> {
    return { data: structuredClone(this.data), invalidRecords: 0 };
  }
  async saveProfile(p: Profile): Promise<void> {
    this.data.profile = ProfileSchema.parse(p);
  }
  async saveSettings(s: Settings): Promise<void> {
    this.data.settings = SettingsSchema.parse(s);
  }
  async putLesson(l: LessonProgress): Promise<void> {
    this.data.lessons = [...this.data.lessons.filter((x) => x.lessonId !== l.lessonId), LessonProgressSchema.parse(l)];
  }
  async deleteLesson(lessonId: string): Promise<void> {
    this.data.lessons = this.data.lessons.filter((x) => x.lessonId !== lessonId);
  }
  async putSkill(s: SkillState): Promise<void> {
    this.data.skills = [...this.data.skills.filter((x) => x.skillId !== s.skillId), SkillStateSchema.parse(s)];
  }
  async addAttempt(a: Attempt): Promise<void> {
    this.data.attempts.push(AttemptSchema.parse(a));
  }
  async addPractice(p: PracticeEntry): Promise<void> {
    this.data.practice = [...this.data.practice.filter((x) => x.id !== p.id), PracticeEntrySchema.parse(p)];
  }
  async addChordChange(c: ChordChangeRecord): Promise<void> {
    this.data.chordChanges.push(ChordChangeRecordSchema.parse(c));
  }
  async putPlanDay(p: PlanDay): Promise<void> {
    this.data.planDays = [...this.data.planDays.filter((x) => x.day !== p.day), PlanDaySchema.parse(p)];
  }
  async replaceAll(data: AppData): Promise<void> {
    this.data = structuredClone(data);
  }
  async clearAll(): Promise<void> {
    this.data = emptyData();
  }
}

export async function openStorage(): Promise<AppStorage> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB indisponível');
    return await IndexedDbStorage.open();
  } catch {
    return new MemoryStorage();
  }
}
