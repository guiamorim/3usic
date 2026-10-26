// Zod schemas are the single source of truth for persisted data. Every record read from
// IndexedDB or from an imported file is validated against them. Uses `zod/mini` (same engine,
// tree-shakable functional API) to keep the startup bundle small.
import * as z from 'zod/mini';

export const SCHEMA_VERSION = 2;

const str = (min: number, max: number) => z.string().check(z.minLength(min), z.maxLength(max));
const int = (min: number, max: number) => z.int().check(z.minimum(min), z.maximum(max));
const num = (min: number, max: number) => z.number().check(z.minimum(min), z.maximum(max));

export const InstrumentSchema = z.enum(['electric', 'acoustic', 'steel-violao', 'classical']);
export const ExperienceSchema = z.enum(['none', 'some', 'intermediate']);
export const GoalSchema = z.enum(['chords-songs', 'melody-riffs', 'fingerstyle', 'theory-ear']);
export const GenreSchema = z.enum(['pop', 'rock', 'folk', 'blues', 'mpb-bossa', 'fado-tradicional', 'classica', 'outro']);

export const ProfileSchema = z.strictObject({
  instrument: InstrumentSchema,
  experience: ExperienceSchema,
  goal: GoalSchema,
  genres: z.array(GenreSchema).check(z.maxLength(8)),
  sessionMinutes: int(5, 120),
  daysPerWeek: int(1, 7),
  a4: z._default(num(415, 466), 440),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const IdSchema = str(1, 80).check(z.regex(/^[A-Za-z0-9#:_-]+$/));
const DaySchema = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export const LessonProgressSchema = z.strictObject({
  lessonId: IdSchema,
  completedAt: z.iso.datetime(),
});

export const SkillStateSchema = z.strictObject({
  skillId: IdSchema,
  /** Leitner box 0..5. */
  box: int(0, 5),
  dueDay: DaySchema,
  lastPracticedDay: DaySchema,
  /** Days on which a session was passed (≥ 80 %). Used for consistency-based mastery. */
  passedDays: z.array(DaySchema).check(z.maxLength(50)),
  lastScore: num(0, 1),
  attempts: int(0, 1_000_000),
});

export const AttemptSchema = z
  .strictObject({
    id: str(1, 80),
    skillId: IdSchema,
    at: z.iso.datetime(),
    correct: int(0, 1000),
    total: int(1, 1000),
    durationSec: num(0, 24 * 3600),
  })
  .check(
    z.refine((a) => a.correct <= a.total, {
      message: 'correct não pode exceder total',
    }),
  );

export const PracticeEntrySchema = z.strictObject({
  id: str(1, 80),
  day: DaySchema,
  seconds: int(0, 24 * 3600),
  source: z.enum(['lesson', 'exercise', 'metronome', 'tuner', 'plan', 'chord-changes', 'song', 'strum']),
  label: z.string().check(z.maxLength(120)),
});

export const ChordChangeRecordSchema = z.strictObject({
  id: str(1, 80),
  pair: str(3, 40),
  day: DaySchema,
  changes: int(0, 300),
});

export const PlanDaySchema = z.strictObject({
  day: DaySchema,
  doneBlockIds: z.array(z.string().check(z.maxLength(40))).check(z.maxLength(20)),
});

export const SettingsSchema = z.strictObject({
  metronomeBpm: int(30, 240),
  metronomeSignature: z.string().check(z.maxLength(5)),
  metronomeAccent: z.boolean(),
  metronomeVolume: num(0, 1),
  /** Song the user is working towards (catalogue id or imported song id). */
  targetSongId: z.optional(str(1, 80)),
  /** Library chord ids the user says they already know (besides those from lessons). */
  knownChords: z.optional(z.array(IdSchema).check(z.maxLength(100))),
  /** Which version of song sheets to show by default. */
  songVersion: z.optional(z.enum(['simple', 'full'])),
  /** Keep the screen on while the app is open (Screen Wake Lock API). */
  keepAwake: z.optional(z.boolean()),
  /** Last day the user exported their data, and until when the backup reminder is hidden. */
  lastExportDay: z.optional(DaySchema),
  backupSnoozedUntil: z.optional(DaySchema),
  /** Chord recognition sensitivity for «Tocar junto». */
  micSensitivity: z.optional(z.enum(['low', 'normal', 'high'])),
});

export const MAX_USER_SONGS = 300;
export const MAX_SONG_TEXT = 200_000;

/** Song imported by the user. Stored only on this device; the sheet is kept as ChordPro text. */
export const UserSongSchema = z.strictObject({
  id: IdSchema,
  title: str(1, 120),
  artist: z.string().check(z.maxLength(120)),
  genre: GenreSchema,
  year: z.nullable(int(1000, 2100)),
  chordpro: str(1, MAX_SONG_TEXT),
  /** Catalogue song this sheet belongs to (the user's own cifra with lyrics). */
  catalogId: z.optional(str(1, 80)),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ExportFileSchema = z.strictObject({
  app: z.literal('braco-guitarra'),
  schemaVersion: z.int().check(z.minimum(1)),
  exportedAt: z.iso.datetime(),
  data: z.strictObject({
    profile: z.nullable(ProfileSchema),
    settings: z.nullable(SettingsSchema),
    lessons: z.array(LessonProgressSchema).check(z.maxLength(1000)),
    skills: z.array(SkillStateSchema).check(z.maxLength(1000)),
    attempts: z.array(AttemptSchema).check(z.maxLength(50_000)),
    practice: z.array(PracticeEntrySchema).check(z.maxLength(50_000)),
    chordChanges: z.array(ChordChangeRecordSchema).check(z.maxLength(10_000)),
    planDays: z.array(PlanDaySchema).check(z.maxLength(5000)),
    songs: z.array(UserSongSchema).check(z.maxLength(MAX_USER_SONGS)),
  }),
});

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
