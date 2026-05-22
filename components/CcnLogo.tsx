import React from 'react';

interface CcnLogoProps {
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { height: 40, viewBoxH: 80 },
  md: { height: 52, viewBoxH: 80 },
  lg: { height: 80, viewBoxH: 80 },
};

const VIEWBOX_W = 220;
const VIEWBOX_H = 80;

const CcnLogo: React.FC<CcnLogoProps> = ({
  theme = 'auto',
  className = '',
  size = 'md',
}) => {
  const { height } = SIZE_MAP[size];
  const width = Math.round((height / VIEWBOX_H) * VIEWBOX_W);

  let textColor: string;
  if (theme === 'light') {
    textColor = '#5E0F0F';
  } else if (theme === 'dark') {
    textColor = '#F0E8D8';
  } else {
    // 'auto' — driven by CSS currentColor; parent sets color via .dark selector
    textColor = 'currentColor';
  }

  const gradId = 'ccnFlameGrad';

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="THE CCN DAILY"
      role="img"
      className={`ccn-logo${className ? ' ' + className : ''}`}
      style={theme === 'auto' ? undefined : { color: textColor }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#5E0F0F" />
          <stop offset="35%"  stopColor="#8E1B1B" />
          <stop offset="65%"  stopColor="#C23B1E" />
          <stop offset="100%" stopColor="#E87A2C" />
        </linearGradient>
      </defs>

      {/* ── Flame icon ── left side, centred vertically in 80px tall viewbox */}
      <g aria-hidden="true">
        {/* Main tall flame — teardrop bezier */}
        <path
          d={`
            M 32,72
            C 16,72 8,58 10,44
            C 12,32 22,26 24,18
            C 26,10 28,4 30,2
            C 31,8 30,16 34,22
            C 38,28 42,30 42,40
            C 42,54 38,66 32,72
            Z
          `}
          fill={`url(#${gradId})`}
        />
        {/* Smaller right accent flame */}
        <path
          d={`
            M 46,72
            C 40,72 36,64 37,54
            C 38,46 43,42 44,36
            C 45,30 45,26 46,24
            C 47,28 46,32 49,36
            C 52,40 54,44 54,52
            C 54,62 51,70 46,72
            Z
          `}
          fill={`url(#${gradId})`}
          opacity="0.85"
        />
      </g>

      {/* ── Wordmark — stacked, right of flame ── */}
      {/* "THE" — small eyebrow */}
      <text
        x="66"
        y="26"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="13"
        fontWeight="400"
        letterSpacing="0.18em"
        fill={textColor}
      >
        THE
      </text>

      {/* "CCN" — large bold */}
      <text
        x="64"
        y="55"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="30"
        fontWeight="700"
        letterSpacing="0.06em"
        fill={textColor}
      >
        CCN
      </text>

      {/* "DAILY" — large bold */}
      <text
        x="66"
        y="74"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.22em"
        fill={textColor}
      >
        DAILY
      </text>
    </svg>
  );
};

export default CcnLogo;
