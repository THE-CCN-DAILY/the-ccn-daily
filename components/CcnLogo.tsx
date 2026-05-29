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
      {/* Brand flame — color PNG for dark/sepia, black PNG for light */}
      <img
        src={isLight ? '/logo-flame-black.png' : '/logo-flame-color.png'}
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
        style={{ height: wordmark, width: 'auto', display: 'block', objectFit: 'contain', flexShrink: 0 }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default CcnLogo;
