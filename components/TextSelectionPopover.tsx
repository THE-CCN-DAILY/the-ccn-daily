import React from 'react';
import { NoteIcon, CopyIcon, ShareIcon } from './icons';
import type { Highlight } from '../types';

interface TextSelectionPopoverProps {
  top: number;
  left: number;
  onHighlight: (color: Highlight['color']) => void;
  onAddNote: () => void;
  onCopy: () => void;
  onShare: () => void;
}

const highlightColors = [
    { name: 'yellow', class: 'bg-yellow-400' },
    { name: 'blue', class: 'bg-sky-400' },
    { name: 'green', class: 'bg-green-400' },
    { name: 'pink', class: 'bg-pink-400' },
] as const;


const TextSelectionPopover: React.FC<TextSelectionPopoverProps> = ({ top, left, onHighlight, onAddNote, onCopy, onShare }) => {
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
  
  const separatorStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--reader-border, var(--color-border)))`
  };

  // FIX: Added onMouseUp={(e) => e.stopPropagation()} to definitively prevent the event from bubbling
  // up to the parent container and clearing the text selection.
  return (
    <div
      className="absolute z-20 flex items-center space-x-1 p-2 rounded-lg shadow-lg border"
      style={popoverStyle}
      onMouseDown={(e) => e.preventDefault()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-2">
        {highlightColors.map(color => (
            <button
                key={color.name}
                onClick={() => onHighlight(color.name)}
                onMouseDown={(e) => e.preventDefault()}
                className={`w-6 h-6 rounded-full ${color.class} border-2 border-[rgb(var(--reader-bg,var(--color-surface)))] ring-1 ring-[rgb(var(--reader-border,var(--color-border)))] hover:scale-110 transition-transform`}
                title={`Highlight ${color.name}`}
            />
        ))}
      </div>
      <div className="w-px h-6 mx-2" style={separatorStyle}></div>
      <button 
        onClick={onAddNote}
        onMouseDown={(e) => e.preventDefault()}
        style={buttonStyle}
        className="p-2 rounded-md hover:bg-black/10"
        title="Add Note"
      >
        <NoteIcon className="w-5 h-5" />
      </button>
      <button 
        onClick={onCopy}
        onMouseDown={(e) => e.preventDefault()}
        style={buttonStyle}
        className="p-2 rounded-md hover:bg-black/10"
        title="Copy"
      >
        <CopyIcon className="w-5 h-5" />
      </button>
      <button 
        onClick={onShare}
        onMouseDown={(e) => e.preventDefault()}
        style={buttonStyle}
        className="p-2 rounded-md hover:bg-black/10"
        title="Share"
      >
        <ShareIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TextSelectionPopover;