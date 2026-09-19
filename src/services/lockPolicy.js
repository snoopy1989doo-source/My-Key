export const BACKGROUND_LOCK_OPTIONS = [0, 15, 30, 60, 120];

export function normalizeBackgroundLockSeconds(value) {
  const seconds = Number(value);
  return BACKGROUND_LOCK_OPTIONS.includes(seconds) ? seconds : 30;
}

export function shouldLockAfterBackground(hiddenAt, now, seconds) {
  if (!hiddenAt) return false;
  return now - hiddenAt >= normalizeBackgroundLockSeconds(seconds) * 1000;
}
