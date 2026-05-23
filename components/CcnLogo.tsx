import React from 'react';

interface CcnLogoProps {
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Flame icon sizes per variant
const FLAME_SIZES = {
  sm: { container: 32, svg: 32 },
  md: { container: 44, svg: 44 },
  lg: { container: 64, svg: 64 },
};

const TEXT_SIZES = {
  sm: { eyebrow: '9px', main: '20px', sub: '11px', gap: '6px' },
  md: { eyebrow: '11px', main: '26px', sub: '14px', gap: '8px' },
  lg: { eyebrow: '14px', main: '38px', sub: '20px', gap: '10px' },
};

/**
 * CCN Daily logo — hybrid approach:
 * - Flame is pure SVG paths (font-free, renders perfectly anywhere)
 * - Wordmark is HTML text so web fonts load reliably via CSS
 */
const CcnLogo: React.FC<CcnLogoProps> = ({
  theme = 'auto',
  className = '',
  size = 'md',
}) => {
  const { container, svg } = FLAME_SIZES[size];
  const { eyebrow, main, sub, gap } = TEXT_SIZES[size];

  let textColor: string;
  if (theme === 'light') {
    textColor = '#3D1A0A';
  } else if (theme === 'dark') {
    textColor = '#F0E8D8';
  } else {
    textColor = 'currentColor';
  }

  return (
    <div
      className={`ccn-logo inline-flex items-center${className ? ' ' + className : ''}`}
      style={{ gap }}
      aria-label="THE CCN DAILY"
      role="img"
    >
      {/* ── Flame ── pure SVG paths, no fonts */}
      <svg
        width={svg}
        height={container}
        viewBox="0 0 54 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ccnFlameG" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#5E0F0F" />
            <stop offset="35%"  stopColor="#8E1B1B" />
            <stop offset="65%"  stopColor="#C23B1E" />
            <stop offset="100%" stopColor="#E87A2C" />
          </linearGradient>
        </defs>
        {/* Main tall flame */}
        <path
          d="M32,72 C16,72 8,58 10,44 C12,32 22,26 24,18 C26,10 28,4 30,2 C31,8 30,16 34,22 C38,28 42,30 42,40 C42,54 38,66 32,72 Z"
          fill="url(#ccnFlameG)"
        />
        {/* Smaller right accent flame */}
        <path
          d="M46,72 C40,72 36,64 37,54 C38,46 43,42 44,36 C45,30 45,26 46,24 C47,28 46,32 49,36 C52,40 54,44 54,52 C54,62 51,70 46,72 Z"
          fill="url(#ccnFlameG)"
          opacity="0.85"
        />
      </svg>

      {/* ── Wordmark ── HTML text, inherits CSS web fonts reliably */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, color: textColor }}>
        <span
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)',
            fontSize: eyebrow,
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            opacity: 0.75,
            marginBottom: '1px',
          }}
        >
          THE
        </span>
        <span
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)',
            fontSize: main,
            fontWeight: 700,
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          CCN
        </span>
        <span
          style={{
            fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)',
            fontSize: sub,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginTop: '1px',
          }}
        >
          DAILY
        </span>
      </div>
    </div>
  );
};

export default CcnLogo;
