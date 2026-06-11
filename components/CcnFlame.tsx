import React from 'react';

interface CcnFlameProps {
  /** Rendered width/height in pixels. */
  size?: number;
  className?: string;
  /** Soft pulse for "thinking" / live states. */
  pulse?: boolean;
}

/**
 * The CCN Daily brand flame mark — the real logo asset, not a stock flame.
 *
 * Use this anywhere the brand's flame should appear on its own (chat avatars,
 * loading marks, empty states). The full lockup with the wordmark lives in
 * CcnLogo. The transparent PNG sits correctly on any light or dark surface.
 */
const CcnFlame: React.FC<CcnFlameProps> = ({ size = 32, className = '', pulse = false }) => (
  <img
    src="/flame-transparent.png"
    alt="THE CCN DAILY"
    width={size}
    height={size}
    className={`${pulse ? 'animate-pulse ' : ''}${className}`.trim()}
    style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block' }}
    loading="eager"
    decoding="async"
  />
);

export default CcnFlame;
