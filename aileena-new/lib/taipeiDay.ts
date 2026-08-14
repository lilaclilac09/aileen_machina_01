/**
 * Civil calendar day in Asia/Taipei (YYYY-MM-DD).
 * Draw locks to this clock — not the visitor's local quota day.
 */

export function taipeiDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
