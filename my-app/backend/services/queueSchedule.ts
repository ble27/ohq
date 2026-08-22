/**
 * Whether `now` falls in the queue's scheduled window.
 * Window is [startsAt, endsAt): open at start, closed at/after end.
 * A missing endsAt means the queue stays eligible after startsAt.
 */
export function isWithinQueueHours(
  startsAt: Date,
  endsAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (now.getTime() < startsAt.getTime()) return false;
  if (endsAt != null && now.getTime() >= endsAt.getTime()) return false;
  return true;
}
