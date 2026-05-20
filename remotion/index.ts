/**
 * Remotion entry point — imported by `npx remotion studio` and `npx remotion render`.
 *
 * Commands (run from project root):
 *   Preview in browser:       npx remotion studio remotion/index.ts
 *   Render verse card (dark): npx remotion render remotion/index.ts VerseCard --props='{"verseText":"...","verseRef":"John 3:16","theme":"dark"}' out/verse-dark.mp4
 *   Render square format:     npx remotion render remotion/index.ts VerseCardSquare out/verse-square.mp4
 */

import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
