import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CcnLogoProps {
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { icon: 30, wordmark: 26 },
  md: { icon: 44, wordmark: 36 },
  lg: { icon: 60, wordmark: 52 },
};

// Flame + wordmark read as ONE lockup: zero flex gap, plus a negative margin (PULL)
// on the wordmark to absorb the images' transparent internal padding.
const GAP = { sm: 0, md: 0, lg: 0 };
const PULL = { sm: 4, md: 6, lg: 8 };

/**
 * CCN Daily logo — brand-accurate, theme-aware
 *
 * Dark / sepia  → /flame-transparent.png  +  /logo-wordmark-white.webp
 * Light         → /flame-transparent.png  +  /logo-wordmark-black.webp
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
      {/* Brand flame — transparent PNG, works on all backgrounds */}
      <img
        src="/flame-transparent.png"
        alt=""
        aria-hidden="true"
        width={icon}
        height={icon}
        style={{ width: icon, height: icon, display: 'block', objectFit: 'contain', flexShrink: 0 }}
        loading="eager"
        decoding="async"
      />

      {/* Wordmark — official brand PNG, theme-aware */}
      <img
        src={wordmarkSrc}
        alt="THE CCN DAILY"
        height={wordmark}
        style={{ height: wordmark, width: 'auto', display: 'block', objectFit: 'contain', flexShrink: 0, marginLeft: -PULL[size] }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default CcnLogo;
