/**
 * Owner door. POSTs the key (not a query string) so it stays out of history.
 * Bookmark /council or /cabinet — the cookie lasts a year after one good enter.
 */
export default function OwnerUnlockForm({
  next,
  enterLabel = 'enter',
  denied = false,
}: {
  next: '/council' | '/cabinet' | '/inbox' | '/daily' | '/two-lines';
  enterLabel?: string;
  denied?: boolean;
}) {
  return (
    <form action="/api/auth/owner" method="post" className="space-y-3 max-w-md">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1.5">
        <span className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
          owner key
        </span>
        <input
          type="password"
          name="key"
          required
          autoComplete="off"
          spellCheck={false}
          className="w-full min-h-11 bg-white border border-[#ded8ce] px-3 py-2 text-base sm:text-sm text-[#1b1713]/90 outline-none focus:border-[#00a89d]/70 caret-[#00a89d]"
        />
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] transition-colors"
      >
        {enterLabel}
      </button>
      {denied ? (
        <p className="text-[0.8rem] leading-relaxed text-[#1b1713]/55">
          That key did not open the door. Same secret as Vercel <code>OWNER_KEY</code> /{' '}
          <code>.env.local</code>.
        </p>
      ) : (
        <p className="text-[0.75rem] leading-relaxed text-[#1b1713]/45">
          One good enter, then this browser stays in for a year. Visitors cannot use this
          room.
        </p>
      )}
    </form>
  );
}
