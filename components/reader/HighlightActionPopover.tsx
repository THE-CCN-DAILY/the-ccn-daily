import React from 'react';

interface HighlightActionPopoverProps {
  top: number;
  left: number;
  onRemove: () => void;
  onClose: () => void;
}

const HighlightActionPopover: React.FC<HighlightActionPopoverProps> = ({ top, left, onRemove, onClose }) => {
  if (top === 0 && left === 0) return null;

  const popoverStyle: React.CSSProperties = {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translateX(-50%)',
    backgroundColor: `rgb(var(--reader-bg, var(--color-surface)))`,
    borderColor: `rgb(var(--reader-border, var(--color-border)))`,
  };

  const buttonStyle: React.CSSProperties = {
     color: `rgb(var(--reader-text-secondary, var(--color-text-secondary)))`,
  };

  return (
    <div
      className="absolute z-20 flex items-center p-1 rounded-lg shadow-lg border"
      style={popoverStyle}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onRemove}
        style={buttonStyle}
        className="px-3 py-1 text-sm rounded-md hover:bg-black/10"
        title="Remove Highlight"
      >
        Remove
      </button>
    </div>
  );
};

export default HighlightActionPopover;