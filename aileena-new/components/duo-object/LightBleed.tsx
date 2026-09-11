/** Third screen: hinge / back / floor leak. Not a UI chrome. */
export default function LightBleed() {
  return (
    <div className="duo-bleed-wrap" aria-hidden>
      <span className="duo-bleed duo-bleed-back" />
      <span className="duo-bleed duo-bleed-hinge" />
      <span className="duo-bleed duo-bleed-floor" />
    </div>
  );
}
