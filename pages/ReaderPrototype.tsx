import React from 'react';
import EpubReader from '../components/reader/EpubReader';

const ReaderPrototype: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Reader Prototype</h1>
        <p className="text-lg text-brand-text-secondary mb-8">
          This is an interactive mockup for the immersive reader, now with persistent notes and highlights linked to your account via Firestore.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <EpubReader />
      </div>
    </div>
  );
};

export default ReaderPrototype;