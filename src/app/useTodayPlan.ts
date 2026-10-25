import { useMemo } from 'react';
import { useStore } from './store';
import { href } from './router';
import { localDay } from '../domain/dates';
import { buildDailyPlan, planCompletion, type BlockKind, type PlanBlock } from '../domain/plan';
import { recommendedLesson } from '../domain/progression';
import { findSong, versionOf } from '../domain/songLibrary';
import { buildSongPlan, knownChordIds, songFocus } from '../domain/songPlan';

/** Blocks whose time isn't logged automatically by another activity. */
export const LOG_ON_CHECK = new Set<BlockKind>(['aquecimento', 'aplicacao']);

/** Today's plan, shared by the home screen and the guided "next step" bar. */
export function useTodayPlan() {
  const { data, completedLessons, settings } = useStore();
  const profile = data.profile;
  const today = localDay();
  const recommended = profile ? recommendedLesson(completedLessons, profile.experience) : null;
  const target = useMemo(() => {
    const song = settings.targetSongId ? findSong(settings.targetSongId, data.songs) : undefined;
    if (!song) return null;
    const known = knownChordIds(completedLessons, settings.knownChords);
    const v = versionOf(song, settings.songVersion ?? 'simple');
    const songPlan = buildSongPlan({ sequence: v.sequence, known, tempo: v.sheet.meta.tempo });
    return { song, songPlan, focus: songFocus(songPlan), route: href('musicas', song.id) };
  }, [settings.targetSongId, settings.knownChords, settings.songVersion, data.songs, completedLessons]);
  const plan: PlanBlock[] = useMemo(
    () =>
      profile
        ? buildDailyPlan({
            profile,
            today,
            completedLessons,
            recommended,
            skills: data.skills,
            targetSong: target ? { title: target.song.title, route: target.route, focus: target.focus } : undefined,
          })
        : [],
    [profile, today, completedLessons, recommended, data.skills, target],
  );
  const planDay = data.planDays.find((p) => p.day === today);
  const done = useMemo(() => new Set<string>(planDay?.doneBlockIds ?? []), [planDay]);
  return { plan, done, completion: planCompletion(plan, planDay), recommended, target, today };
}
