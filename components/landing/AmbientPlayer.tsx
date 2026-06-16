/**
 * AmbientPlayer — the heavy half of the landing ambient motion, split into its
 * own module so React.lazy() can keep @remotion/player and the Remotion runtime
 * out of the initial landing bundle. Only loaded when the section scrolls into
 * view and the visitor hasn't asked for reduced motion.
 */

import React from 'react';
import { Player } from '@remotion/player';
import { DawnAmbient } from '../../remotion/DawnAmbient';

const DA = DawnAmbient as unknown as React.ComponentType<Record<string, unknown>>;

interface AmbientPlayerProps {
  verseText: string;
  verseRef: string;
  theme: 'dark' | 'light' | 'sepia';
}

const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ verseText, verseRef, theme }) => (
  <Player
    component={DA}
    inputProps={{ verseText, verseRef, theme }}
    durationInFrames={240}
    compositionWidth={1920}
    compositionHeight={800}
    fps={30}
    loop
    autoPlay
    // Remotion is already a project dependency (social VerseCard). CCN is a small
    // ministry on Remotion's free tier; acknowledging here only silences the console
    // notice. Revisit if team size / revenue crosses Remotion's paid threshold.
    acknowledgeRemotionLicense
    controls={false}
    showVolumeControls={false}
    clickToPlay={false}
    doubleClickToFullscreen={false}
    style={{ width: '100%', height: '100%' }}
  />
);

export default AmbientPlayer;
