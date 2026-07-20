import React from 'react';

// FIX: Extend React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onMouseUp.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// FIX: Use React.forwardRef to allow refs to be passed to the underlying div element, fixing the error in ReaderPrototype.tsx.
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', ...props }, ref) => {
  const cardStyle: React.CSSProperties = {
    // Default to global variables, but allow reader-specific variables to override
    backgroundColor: `var(--reader-bg, var(--bg-card))`,
    borderColor: 'rgba(var(--border-raw), 0.15)',
    // Inner top highlight simulates ambient light from above — depth without heavy shadow
    boxShadow: 'var(--sh-card, var(--card-shine))',
  };

  return (
    // FIX: Spread the rest of the props onto the div.
    <div ref={ref} {...props} style={{ ...cardStyle, ...props.style }} className={`rounded-lg border border-brand-border/15 p-6 ${className}`}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
