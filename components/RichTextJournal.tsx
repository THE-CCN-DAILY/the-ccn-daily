import React, { useRef } from 'react';
import { Bold, Italic, Heading2, List } from 'lucide-react';

interface RichTextJournalProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextJournal: React.FC<RichTextJournalProps> = ({
  value,
  onChange,
  placeholder = 'What is on your heart today?',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const selected = textarea.value.slice(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newValue =
      textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + (selected || 'text').length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart: start } = textarea;
    const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
    const newValue =
      textarea.value.slice(0, lineStart) + prefix + textarea.value.slice(lineStart);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  interface ToolbarButtonProps {
    onClick: () => void;
    title: string;
    icon: React.ElementType;
    label: string;
  }

  const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, title, icon: Icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      title={title}
      aria-label={label}
      className="flex items-center justify-center w-7 h-7 rounded hover:bg-brand-border/60 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div
      className={`overflow-hidden border border-brand-border rounded-xl focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent/30 transition-all ${className}`}
    >
      {/* Formatting toolbar */}
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 border-b border-brand-border"
        style={{ background: 'var(--bg-paper, #F6EFE1)' }}
      >
        <ToolbarButton
          onClick={() => insertFormatting('**')}
          title="Bold (wrap selection in **)"
          label="Bold"
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => insertFormatting('_')}
          title="Italic (wrap selection in _)"
          label="Italic"
          icon={Italic}
        />
        <div className="w-px h-4 bg-brand-border mx-1" />
        <ToolbarButton
          onClick={() => insertLinePrefix('## ')}
          title="Heading (## prefix)"
          label="Heading"
          icon={Heading2}
        />
        <ToolbarButton
          onClick={() => insertLinePrefix('- ')}
          title="Bullet list (- prefix)"
          label="Bullet list"
          icon={List}
        />
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-40 p-4 resize-none text-brand-text-primary placeholder-brand-text-secondary/60 focus:outline-none rounded-b-xl"
        style={{
          fontFamily: 'var(--serif-body)',
          lineHeight: 1.65,
          background: 'var(--bg-paper, #F6EFE1)',
        }}
      />
    </div>
  );
};

export default RichTextJournal;
