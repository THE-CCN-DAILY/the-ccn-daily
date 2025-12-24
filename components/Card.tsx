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
    backgroundColor: `rgba(var(--reader-bg, var(--color-brand-dark)), var(--reader-bg-alpha, 0.5))`,
    borderColor: `rgb(var(--reader-border, var(--color-brand-border)))`,
    // In a full implementation, shadow color could also be a variable
  };

  return (
    // FIX: Spread the rest of the props onto the div.
    <div ref={ref} {...props} style={cardStyle} className={`backdrop-blur-sm border rounded-xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;