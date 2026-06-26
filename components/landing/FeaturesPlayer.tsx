/**
 * FeaturesPlayer — renders the animated features slideshow Remotion composition.
 * Code-split from the initial bundle using React.lazy().
 */

import React from 'react';
import { Player } from '@remotion/player';
import { FeaturesAmbient } from '../../remotion/FeaturesAmbient';

const FA = FeaturesAmbient as unknown as React.ComponentType<Record<string, unknown>>;

interface FeaturesPlayerProps {
  theme: 'dark' | 'light' | 'sepia';
}

const FeaturesPlayer: React.FC<FeaturesPlayerProps> = ({ theme }) => (
  <Player
    component={FA}
    inputProps={{ theme }}
    durationInFrames={450}
    compositionWidth={1920}
    compositionHeight={800}
    fps={30}
    loop
    autoPlay
    acknowledgeRemotionLicense
    controls={false}
    showVolumeControls={false}
    clickToPlay={false}
    doubleClickToFullscreen={false}
    style={{ width: '100%', height: '100%' }}
  />
);

export default FeaturesPlayer;
