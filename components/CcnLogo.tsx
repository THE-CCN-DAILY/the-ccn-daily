import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CcnLogoProps {
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { icon: 24, wordmark: 22 },
  md: { icon: 36, wordmark: 32 },
  lg: { icon: 52, wordmark: 48 },
};

const GAP = { sm: 5, md: 7, lg: 10 };

/**
 * CCN Daily logo — brand-accurate, theme-aware
 *
 * Dark / sepia  → SVG gradient flame  +  /logo-wordmark-white.webp
 * Light         → /logo-flame-black.png (transparent)  +  /logo-wordmark-black.webp
 */
const CcnLogo: React.FC<CcnLogoProps> = ({
  theme = 'auto',
  className = '',
  size = 'md',
}) => {
  const { icon, wordmark } = SIZES[size];
  const { theme: appTheme } = useTheme();

  const resolved = theme === 'auto'
    ? (appTheme === 'light' ? 'light' : 'dark')
    : theme;

  const isLight = resolved === 'light';
  const wordmarkSrc = isLight ? '/logo-wordmark-black.webp' : '/logo-wordmark-white.webp';

  return (
    <div
      className={`ccn-logo inline-flex items-center${className ? ' ' + className : ''}`}
      style={{ gap: GAP[size] }}
      aria-label="THE CCN DAILY"
      role="img"
    >
      {isLight ? (
        /* Light mode: solid black transparent PNG — crisp on white/sepia */
        <img
          src="/logo-flame-black.png"
          alt=""
          aria-hidden="true"
          width={icon}
          height={icon}
          style={{ width: icon, height: icon, display: 'block', objectFit: 'contain', flexShrink: 0 }}
          loading="eager"
          decoding="async"
        />
      ) : (
        /* Dark / sepia mode: SVG gradient flame — no background artifacts */
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 54 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <defs>
            <linearGradient id="ccnFlameG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#5E0F0F" />
              <stop offset="30%"  stopColor="#8E1B1B" />
              <stop offset="62%"  stopColor="#C23B1E" />
              <stop offset="100%" stopColor="#E87A2C" />
            </linearGradient>
          </defs>
          <path
            d="M32,72 C16,72 8,58 10,44 C12,32 22,26 24,18 C26,10 28,4 30,2 C31,8 30,16 34,22 C38,28 42,30 42,40 C42,54 38,66 32,72 Z"
            fill="url(#ccnFlameG)"
          />
          <path
            d="M46,72 C40,72 36,64 37,54 C38,46 43,42 44,36 C45,30 45,26 46,24 C47,28 46,32 49,36 C52,40 54,44 54,52 C54,62 51,70 46,72 Z"
            fill="url(#ccnFlameG)"
            opacity="0.85"
          />
        </svg>
      )}

      {/* Wordmark — official brand PNG, theme-aware */}
      <img
        src={wordmarkSrc}
        alt="THE CCN DAILY"
        height={wordmark}
        style={{ height: wordmark, width: 'auto', display: 'block', objectFit: 'contain', flexShrink: 0 }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default CcnLogo;
