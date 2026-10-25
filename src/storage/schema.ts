// Zod schemas are the single source of truth for persisted data. Every record read from
// IndexedDB or from an imported file is validated against them.
import { z } from 'zod';

export const SCHEMA_VERSION = 2;

export const InstrumentSchema = z.enum(['electric', 'acoustic', 'steel-violao', 'classical']);
export const ExperienceSchema = z.enum(['none', 'some', 'intermediate']);
export const GoalSchema = z.enum(['chords-songs', 'melody-riffs', 'fingerstyle', 'theory-ear']);
export const GenreSchema = z.enum(['pop', 'rock', 'folk', 'blues', 'mpb-bossa', 'fado-tradicional', 'classica', 'outro']);

export const ProfileSchema = z
  .object({
    instrument: InstrumentSchema,
    experience: ExperienceSchema,
    goal: GoalSchema,
    genres: z.array(GenreSchema).max(8),
    sessionMinutes: z.number().int().min(5).max(120),
    daysPerWeek: z.number().int().min(1).max(7),
    a4: z.number().min(415).max(466).default(440),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

const IdSchema = z.string().min(1).max(80).regex(/^[A-Za-z0-9#:_-]+$/);
const DaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const LessonProgressSchema = z
  .object({
    lessonId: IdSchema,
    completedAt: z.iso.datetime(),
  })
  .strict();

export const SkillStateSchema = z
  .object({
    skillId: IdSchema,
    /** Leitner box 0..5. */
    box: z.number().int().min(0).max(5),
    dueDay: DaySchema,
    lastPracticedDay: DaySchema,
    /** Days on which a session was passed (≥ 80 %). Used for consistency-based mastery. */
    passedDays: z.array(DaySchema).max(50),
    lastScore: z.number().min(0).max(1),
    attempts: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export const AttemptSchema = z
  .object({
    id: z.string().min(1).max(80),
    skillId: IdSchema,
    at: z.iso.datetime(),
    correct: z.number().int().min(0).max(1000),
    total: z.number().int().min(1).max(1000),
    durationSec: z.number().min(0).max(24 * 3600),
  })
  .strict()
  .refine((a) => a.correct <= a.total, { message: 'correct não pode exceder total' });

export const PracticeEntrySchema = z
  .object({
    id: z.string().min(1).max(80),
    day: DaySchema,
    seconds: z.number().int().min(0).max(24 * 3600),
    source: z.enum(['lesson', 'exercise', 'metronome', 'tuner', 'plan', 'chord-changes', 'song']),
    label: z.string().max(120),
  })
  .strict();

export const ChordChangeRecordSchema = z
  .object({
    id: z.string().min(1).max(80),
    pair: z.string().min(3).max(40),
    day: DaySchema,
    changes: z.number().int().min(0).max(300),
  })
  .strict();

export const PlanDaySchema = z
  .object({
    day: DaySchema,
    doneBlockIds: z.array(z.string().max(40)).max(20),
  })
  .strict();

export const SettingsSchema = z
  .object({
    metronomeBpm: z.number().int().min(30).max(240),
    metronomeSignature: z.string().max(5),
    metronomeAccent: z.boolean(),
    metronomeVolume: z.number().min(0).max(1),
    /** Song the user is working towards (catalogue id or imported song id). */
    targetSongId: z.string().min(1).max(80).optional(),
    /** Library chord ids the user says they already know (besides those from lessons). */
    knownChords: z.array(IdSchema).max(100).optional(),
    /** Which version of song sheets to show by default. */
    songVersion: z.enum(['simple', 'full']).optional(),
  })
  .strict();

export const MAX_USER_SONGS = 300;
export const MAX_SONG_TEXT = 200_000;

/** Song imported by the user. Stored only on this device; the sheet is kept as ChordPro text. */
export const UserSongSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(1).max(120),
    artist: z.string().max(120),
    genre: GenreSchema,
    year: z.number().int().min(1000).max(2100).nullable(),
    chordpro: z.string().min(1).max(MAX_SONG_TEXT),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const ExportFileSchema = z
  .object({
    app: z.literal('braco-guitarra'),
    schemaVersion: z.number().int().min(1),
    exportedAt: z.iso.datetime(),
    data: z
      .object({
        profile: ProfileSchema.nullable(),
        settings: SettingsSchema.nullable(),
        lessons: z.array(LessonProgressSchema).max(1000),
        skills: z.array(SkillStateSchema).max(1000),
        attempts: z.array(AttemptSchema).max(50_000),
        practice: z.array(PracticeEntrySchema).max(50_000),
        chordChanges: z.array(ChordChangeRecordSchema).max(10_000),
        planDays: z.array(PlanDaySchema).max(5000),
        songs: z.array(UserSongSchema).max(MAX_USER_SONGS),
      })
      .strict(),
  })
  .strict();

export type Instrument = z.infer<typeof InstrumentSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type SkillState = z.infer<typeof SkillStateSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
export type PracticeEntry = z.infer<typeof PracticeEntrySchema>;
export type ChordChangeRecord = z.infer<typeof ChordChangeRecordSchema>;
export type PlanDay = z.infer<typeof PlanDaySchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type UserSong = z.infer<typeof UserSongSchema>;
export type ExportFile = z.infer<typeof ExportFileSchema>;
export type AppData = ExportFile['data'];

export const DEFAULT_SETTINGS: Settings = {
  metronomeBpm: 80,
  metronomeSignature: '4/4',
  metronomeAccent: true,
  metronomeVolume: 0.8,
};

export function emptyData(): AppData {
  return {
    profile: null,
    settings: null,
    lessons: [],
    skills: [],
    attempts: [],
    practice: [],
    chordChanges: [],
    planDays: [],
    songs: [],
  };
}
