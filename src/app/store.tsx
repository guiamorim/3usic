import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { openStorage, type AppStorage } from '../storage/db';
import { DEFAULT_SETTINGS, emptyData, type AppData, type PracticeEntry, type Profile, type Settings } from '../storage/schema';
import { localDay, newId } from '../domain/dates';
import { updateSkill } from '../domain/srs';

type Status = 'loading' | 'ready' | 'error';

interface StoreValue {
  status: Status;
  storageKind: AppStorage['kind'] | null;
  invalidRecords: number;
  data: AppData;
  settings: Settings;
  completedLessons: ReadonlySet<string>;
  /** Last persistence error shown to the user, if any. */
  saveError: string | null;
  dismissSaveError(): void;
  saveProfile(p: Omit<Profile, 'createdAt' | 'updatedAt'>): Promise<boolean>;
  saveSettings(s: Partial<Settings>): Promise<boolean>;
  completeLesson(lessonId: string, secondsSpent: number, label: string): Promise<boolean>;
  uncompleteLesson(lessonId: string): Promise<boolean>;
  recordExercise(r: { skillId: string; correct: number; total: number; durationSec: number; label: string }): Promise<boolean>;
  recordPractice(source: PracticeEntry['source'], seconds: number, label: string): Promise<boolean>;
  recordChordChanges(pair: string, changes: number): Promise<boolean>;
  /** Marks a plan block; `logMinutes` records practice for blocks that are not tracked elsewhere. */
  togglePlanBlock(blockId: string, done: boolean, logMinutes?: { minutes: number; label: string }): Promise<boolean>;
  replaceAll(data: AppData): Promise<boolean>;
  clearAll(): Promise<boolean>;
}

const StoreContext = createContext<StoreValue | null>(null);

const MAX_LOGGED_SECONDS = 3 * 3600;

export function StoreProvider({ children, storage: injected }: { children: ReactNode; storage?: AppStorage }) {
  const storageRef = useRef<AppStorage | null>(injected ?? null);
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<AppData>(emptyData);
  const [invalidRecords, setInvalid] = useState(0);
  const [storageKind, setStorageKind] = useState<AppStorage['kind'] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storage = storageRef.current ?? (await openStorage());
        storageRef.current = storage;
        const result = await storage.loadAll();
        if (cancelled) return;
        setData(result.data);
        setInvalid(result.invalidRecords);
        setStorageKind(storage.kind);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Writes first, updates state only on success — the UI never shows unsaved data as saved. */
  const persist = useCallback(async (write: (s: AppStorage) => Promise<void>, next: (d: AppData) => AppData): Promise<boolean> => {
    const storage = storageRef.current;
    if (!storage) return false;
    try {
      await write(storage);
      setData((d) => next(d));
      return true;
    } catch (err) {
      const quota = err instanceof DOMException && err.name === 'QuotaExceededError';
      setSaveError(quota ? 'Sem espaço de armazenamento no dispositivo. Exporta os teus dados e liberta espaço.' : 'Não foi possível guardar. Tenta de novo; se persistir, exporta os teus dados.');
      return false;
    }
  }, []);

  const settings = data.settings ?? DEFAULT_SETTINGS;

  const value = useMemo<StoreValue>(() => {
    const today = () => localDay();
    const practiceEntry = (source: PracticeEntry['source'], seconds: number, label: string): PracticeEntry => ({
      id: newId('p'),
      day: today(),
      seconds: Math.max(0, Math.min(MAX_LOGGED_SECONDS, Math.round(seconds))),
      source,
      label: label.slice(0, 120),
    });

    return {
      status,
      storageKind,
      invalidRecords,
      data,
      settings,
      completedLessons: new Set(data.lessons.map((l) => l.lessonId)),
      saveError,
      dismissSaveError: () => setSaveError(null),

      saveProfile: (p) => {
        const now = new Date().toISOString();
        const profile: Profile = { ...p, createdAt: dataRef.current.profile?.createdAt ?? now, updatedAt: now };
        return persist((s) => s.saveProfile(profile), (d) => ({ ...d, profile }));
      },

      saveSettings: (partial) => {
        const next: Settings = { ...(dataRef.current.settings ?? DEFAULT_SETTINGS), ...partial };
        return persist((s) => s.saveSettings(next), (d) => ({ ...d, settings: next }));
      },

      completeLesson: async (lessonId, secondsSpent, label) => {
        const record = { lessonId, completedAt: new Date().toISOString() };
        const entry = secondsSpent >= 30 ? practiceEntry('lesson', secondsSpent, label) : null;
        return persist(
          async (s) => {
            await s.putLesson(record);
            if (entry) await s.addPractice(entry);
          },
          (d) => ({
            ...d,
            lessons: [...d.lessons.filter((l) => l.lessonId !== lessonId), record],
            practice: entry ? [...d.practice, entry] : d.practice,
          }),
        );
      },

      uncompleteLesson: (lessonId) =>
        persist((s) => s.deleteLesson(lessonId), (d) => ({ ...d, lessons: d.lessons.filter((l) => l.lessonId !== lessonId) })),

      recordExercise: ({ skillId, correct, total, durationSec, label }) => {
        const prev = dataRef.current.skills.find((s) => s.skillId === skillId);
        const skill = updateSkill(prev, skillId, total > 0 ? correct / total : 0, today());
        const attempt = { id: newId('a'), skillId, at: new Date().toISOString(), correct, total, durationSec: Math.round(durationSec) };
        const entry = practiceEntry('exercise', durationSec, label);
        return persist(
          async (s) => {
            await s.putSkill(skill);
            await s.addAttempt(attempt);
            await s.addPractice(entry);
          },
          (d) => ({
            ...d,
            skills: [...d.skills.filter((x) => x.skillId !== skillId), skill],
            attempts: [...d.attempts, attempt],
            practice: [...d.practice, entry],
          }),
        );
      },

      recordPractice: (source, seconds, label) => {
        if (seconds < 30) return Promise.resolve(true);
        const entry = practiceEntry(source, seconds, label);
        return persist((s) => s.addPractice(entry), (d) => ({ ...d, practice: [...d.practice, entry] }));
      },

      recordChordChanges: (pair, changes) => {
        const rec = { id: newId('c'), pair, day: today(), changes };
        const entry = practiceEntry('chord-changes', 60, `Mudanças ${pair}`);
        return persist(
          async (s) => {
            await s.addChordChange(rec);
            await s.addPractice(entry);
          },
          (d) => ({ ...d, chordChanges: [...d.chordChanges, rec], practice: [...d.practice, entry] }),
        );
      },

      togglePlanBlock: (blockId, done, logMinutes) => {
        const day = today();
        const prev = dataRef.current.planDays.find((p) => p.day === day);
        const ids = new Set(prev?.doneBlockIds ?? []);
        if (done) ids.add(blockId);
        else ids.delete(blockId);
        const next = { day, doneBlockIds: [...ids] };
        // Deterministic id: re-checking overwrites, unchecking zeroes the entry.
        const entry: PracticeEntry | null = logMinutes
          ? { id: `plan-${day}-${blockId}`, day, seconds: done ? logMinutes.minutes * 60 : 0, source: 'plan', label: logMinutes.label.slice(0, 120) }
          : null;
        return persist(
          async (s) => {
            await s.putPlanDay(next);
            if (entry) await s.addPractice(entry);
          },
          (d) => ({
            ...d,
            planDays: [...d.planDays.filter((p) => p.day !== day), next],
            practice: entry ? [...d.practice.filter((p) => p.id !== entry.id), entry] : d.practice,
          }),
        );
      },

      replaceAll: (incoming) => persist((s) => s.replaceAll(incoming), () => structuredClone(incoming)),

      clearAll: () => persist((s) => s.clearAll(), () => emptyData()),
    };
  }, [status, storageKind, invalidRecords, data, settings, saveError, persist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore fora do StoreProvider');
  return v;
}
