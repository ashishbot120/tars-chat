const ONLINE_WINDOW_MS = 30_000;

export function isPresenceOnline(lastSeenAt: number | null, onlineFlag: boolean) {
  if (!onlineFlag || !lastSeenAt) return false;
  return Date.now() - lastSeenAt < ONLINE_WINDOW_MS;
}
