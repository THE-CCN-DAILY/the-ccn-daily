import React from 'react';
import ContentDisplay from './ContentDisplay';

const initialContent = `<h2>Chapter 1: The Journey Begins</h2><p>This is how the main body text will appear in the reader. We are aiming for a clean, legible, and immersive experience, much like a premium e-reader. The current font is a classic <strong>Serif,</strong> but you can change it using the controls in the settings modal. The background and text colors automatically adapt to the selected theme—light, dark, or the paper-like sepia mode.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scerisque vitae, consequat in, pretium a, enim.</p><h3>A New Path</h3><p>The ability to adjust text size is crucial for accessibility. We want every user to feel comfortable. Try increasing or decreasing the text size to see how the layout reflows gracefully. All these settings—theme, font, and size—will be saved per user, so when they return, their reading experience is exactly as they left it.</p><blockquote>"The journey of a thousand miles begins with a single step."</blockquote><p>Future features, such as highlighting, note-taking, and commenting, will be seamlessly integrated into this interface. When a user selects text, a small contextual menu will appear, allowing them to perform these actions without leaving the reading flow.</p>`;

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