import React from 'react';

interface ManuscriptQuoteProps {
  quote: string;
  source?: string;
  className?: string;
}

const ManuscriptQuote: React.FC<ManuscriptQuoteProps> = ({ quote, source, className = '' }) => (
  <blockquote className={`border-l-2 border-brand-accent pl-4 ${className}`}>
    <p className="text-sm italic leading-relaxed text-brand-text-secondary" style={{ fontFamily: 'var(--serif-body)' }}>
      "{quote}"
    </p>
    {source && (
      <cite className="mt-1 block text-xs text-brand-text-secondary opacity-70" style={{ fontFamily: 'var(--sans-ui)' }}>
        — {source}
      </cite>
    )}
  </blockquote>
);

export default ManuscriptQuote;
