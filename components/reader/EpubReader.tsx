import React from 'react';
import ContentDisplay from './ContentDisplay';

const initialContent = `<h2>Chapter 1: The Word Takes Root</h2><p>This is how the main body text will appear in the reader. We are aiming for a clean, legible, and immersive experience, much like a premium e-reader. The current font is a classic <strong>Serif,</strong> but you can change it using the controls in the settings modal. The background and text colors automatically adapt to the selected theme—light, dark, or the paper-like sepia mode.</p><p>Scripture is meant to be read slowly, held carefully, and returned to often. This reader is built for that kind of reading — the kind that forms you rather than merely informs you. Take your time. Let the text breathe. Move through it at the pace of understanding, not speed.</p><h3>A Living Word</h3><p>The ability to adjust text size is crucial for accessibility. We want every reader to feel comfortable. Try increasing or decreasing the text size to see how the layout reflows gracefully. All these settings—theme, font, and size—will be saved per user, so when they return, their reading experience is exactly as they left it.</p><blockquote>"Your word is a lamp to my feet and a light to my path." — Psalm 119:105</blockquote><p>Future features, such as highlighting, note-taking, and commenting, will be woven directly into this interface. When a user selects text, a small contextual menu will appear, allowing them to act on the Word without leaving the reading flow.</p>`;

const EpubReader: React.FC = () => {
  return (
      <ContentDisplay
        contentId="epub-1"
        initialContent={initialContent}
        title="Introduction to Faith"
      />
  );
};

export default EpubReader;