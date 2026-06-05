import React from 'react';
import ContentDisplay from './ContentDisplay';

const initialContent = `<h2>Chapter 1: The Word Takes Root</h2><p>The reader is designed for slow, attentive Scripture and ministry reading. The type is quiet, the page breathes, and the controls stay close without taking over the text.</p><p>Scripture is meant to be read slowly, held carefully, and returned to often. This reader is built for that kind of reading - the kind that forms you rather than merely informs you. Take your time. Let the text breathe. Move through it at the pace of understanding, not speed.</p><h3>A Living Word</h3><p>Adjust the text size, theme, and reading style so the page fits your eyes and your hour. Highlights and notes remain connected to the passage, keeping reflection inside the reading flow.</p><blockquote>"Your word is a lamp to my feet and a light to my path." - Psalm 119:105</blockquote><p>When you select text, the reader keeps your actions close to the Word: highlight, note, listen, and return without losing your place.</p>`;

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