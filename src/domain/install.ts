// Whether to recommend installing the app on the home screen, and which steps to show.
// The installed app is the supported way to use it: on iOS it gets its own storage, a full-screen
// window and a working screen wake lock (iOS 18.4+).

export type InstallPlatform = 'ios' | 'android' | 'other';

export interface InstallEnv {
  userAgent: string;
  maxTouchPoints: number;
  /** display-mode: standalone, or navigator.standalone on iOS. */
  standalone: boolean;
}

export function installPlatform(env: Pick<InstallEnv, 'userAgent' | 'maxTouchPoints'>): InstallPlatform {
  const ua = env.userAgent;
  // iPadOS 13+ reports a desktop Mac user agent; touch support gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && env.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/** Show the hint only on phones/tablets running in a browser tab. */
export function shouldShowInstallHint(env: InstallEnv, dismissed: boolean): InstallPlatform | null {
  if (env.standalone || dismissed) return null;
  const p = installPlatform(env);
  return p === 'other' ? null : p;
}
