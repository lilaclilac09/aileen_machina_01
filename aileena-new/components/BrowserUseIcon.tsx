/** Small corresponding browse glyph — same scale as the computer monitor tick. */
export default function BrowserUseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="0.7" y="0.7" width="12.6" height="10.6" rx="1.4" />
      <path d="M0.7 3.4h12.6" />
      <circle cx="3" cy="2.05" r="0.45" fill="currentColor" stroke="none" />
      <circle cx="4.7" cy="2.05" r="0.45" fill="currentColor" stroke="none" />
    </svg>
  );
}
