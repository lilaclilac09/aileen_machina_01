import type { SVGProps } from 'react';
import './crayon.css';

type MarkProps = SVGProps<SVGSVGElement> & { className?: string };

export function CrayonDefs() {
  return (
    <svg className="crayon-defs" aria-hidden>
      <defs>
        <filter id="crayon-wax" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="crayon-wax-heavy" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export function CrayonUnderline({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--underline crayon-shimmer ${className}`} viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden {...rest}>
      <path d="M3 8 C 18 4.5, 36 10.5, 58 7 S 92 11, 117 6.5" strokeWidth="2.3" />
      <path d="M8 9.2 C 28 11, 50 8, 74 9.6" strokeWidth="1.1" opacity="0.45" />
    </svg>
  );
}

export function CrayonCircle({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--circle ${className}`} viewBox="0 0 100 100" aria-hidden {...rest}>
      <ellipse cx="50" cy="51" rx="42" ry="38" strokeWidth="1.9" transform="rotate(-8 50 50)" />
      <ellipse cx="51" cy="50" rx="40" ry="36" strokeWidth="0.9" opacity="0.4" transform="rotate(4 50 50)" />
    </svg>
  );
}

export function CrayonBracket({ corner, className = '', ...rest }: MarkProps & { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const d =
    corner === 'tl' ? 'M22 3 H5 V22' :
    corner === 'tr' ? 'M2 3 H19 V22' :
    corner === 'bl' ? 'M22 21 H5 V2' :
    'M2 21 H19 V2';
  return (
    <svg className={`crayon crayon--bracket crayon--${corner} ${className}`} viewBox="0 0 24 24" aria-hidden {...rest}>
      <path d={d} strokeWidth="2.1" />
    </svg>
  );
}

export function CrayonArrow({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--arrow ${className}`} viewBox="0 0 54 28" aria-hidden {...rest}>
      <path d="M3 16 C 16 14, 28 8, 42 11" strokeWidth="1.8" />
      <path d="M36 6 L46 12 L35 17" strokeWidth="1.7" />
    </svg>
  );
}

export function CrayonFrame({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--frame ${className}`} viewBox="0 0 200 240" preserveAspectRatio="none" aria-hidden {...rest}>
      <path d="M10 14 C 18 8, 70 6, 120 11 S 184 8, 190 18 V 222 C 184 232, 120 228, 80 230 S 14 226, 10 214 Z" strokeWidth="2" />
    </svg>
  );
}

export function CrayonScribble({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--scribble ${className}`} viewBox="0 0 72 22" aria-hidden {...rest}>
      <path d="M2 14 C 10 6, 18 18, 28 11 S 46 18, 58 9 70 16, 70 16" strokeWidth="2.4" />
    </svg>
  );
}

export function CrayonX({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--x ${className}`} viewBox="0 0 14 14" aria-hidden {...rest}>
      <path d="M2 3 L12 12" strokeWidth="1.7" />
      <path d="M12 3 L3 12" strokeWidth="1.6" />
    </svg>
  );
}

export function CrayonDot({ className = '', ...rest }: MarkProps) {
  return (
    <svg className={`crayon crayon--dot crayon--fill ${className}`} viewBox="0 0 10 10" aria-hidden {...rest}>
      <circle cx="5" cy="5" r="2.2" strokeWidth="1.2" />
    </svg>
  );
}

/** Flat architectural plan — crayon linework, not a house icon, not 3D. */
export function CrayonSitemap({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`crayon crayon--sitemap ${className}`}
      viewBox="0 0 168 128"
      data-crayon-sitemap
      aria-hidden
    >
      <path d="M14 18 H154 V110 H14 Z" strokeWidth="1.85" />
      <path d="M14 58 H154" strokeWidth="1.25" />
      <path d="M72 18 V110" strokeWidth="1.2" />
      <path d="M72 58 H110 V110" strokeWidth="1.15" />
      <path d="M28 18 V8 M86 18 V10 M140 18 V8" strokeWidth="1.1" />
      <path d="M96 86 H118" strokeWidth="1.6" />
      <path d="M32 32 h18 v12 h-18 z" strokeWidth="1.2" />
      <path d="M122 32 h20 v12 h-20 z" strokeWidth="1.2" />
    </svg>
  );
}
