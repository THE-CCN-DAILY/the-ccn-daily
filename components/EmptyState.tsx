import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: React.ReactNode;
  heading: string;
  subtext?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  subtext,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}) => (
  <motion.div
    className="flex flex-col items-center justify-center py-20 px-8 text-center"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
      style={{
        background: 'var(--bg-sunk)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,.08)',
      }}
    >
      <span className="opacity-40" style={{ color: 'var(--fg-2)' }}>
        {icon}
      </span>
    </div>

    <h3
      className="mb-2"
      style={{
        fontFamily: 'var(--serif-display)',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--fg-1)',
        lineHeight: 1.2,
      }}
    >
      {heading}
    </h3>

    {subtext && (
      <p
        className="max-w-xs"
        style={{
          fontFamily: 'var(--serif-body)',
          fontStyle: 'italic',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          color: 'var(--fg-3)',
        }}
      >
        {subtext}
      </p>
    )}

    {ctaLabel && (ctaHref || ctaOnClick) && (
      <div className="mt-6">
        {ctaHref ? (
          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--sans-ui)',
              background: 'var(--ember)',
              color: '#fff',
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={ctaOnClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--sans-ui)',
              background: 'var(--ember)',
              color: '#fff',
            }}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    )}
  </motion.div>
);

export default EmptyState;
