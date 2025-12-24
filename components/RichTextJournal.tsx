import React, { useState } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, QuoteIcon } from './icons';

const RichTextJournal: React.FC = () => {
    const [content, setContent] = useState('');

    const handleCommand = (command: string) => {
        document.execCommand(command, false, undefined);
    };

    const ToolbarButton: React.FC<{ command: string; icon: React.FC<any>; title: string }> = ({ command, icon: Icon, title }) => (
        <button
            onClick={() => handleCommand(command)}
            onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
            className="p-2 rounded-md hover:bg-brand-border/50 text-brand-text-secondary"
            title={title}
        >
            <Icon className="w-5 h-5" />
        </button>
    );

    return (
        <div className="border border-brand-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent transition-shadow">
            <div className="flex items-center space-x-1 p-2 border-b border-brand-border bg-brand-secondary/50">
                <ToolbarButton command="bold" icon={BoldIcon} title="Bold" />
                <ToolbarButton command="italic" icon={ItalicIcon} title="Italic" />
                <ToolbarButton command="underline" icon={UnderlineIcon} title="Underline" />
                 <div className="w-px h-6 bg-brand-border mx-1"></div>
                <ToolbarButton command="formatBlock" icon={QuoteIcon} title="Blockquote" />
            </div>
            <div
                contentEditable
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="prose prose-sm max-w-none p-4 h-56 overflow-y-auto bg-brand-secondary text-brand-text-primary focus:outline-none"
                style={{
                    '--tw-prose-body': 'rgb(var(--color-brand-text-primary))',
                    '--tw-prose-bold': 'rgb(var(--color-brand-text-primary))',
                    '--tw-prose-quotes': 'rgb(var(--color-brand-text-secondary))',
                    '--tw-prose-quote-borders': 'rgb(var(--color-brand-accent))',
                } as React.CSSProperties}
            >
            </div>
        </div>
    );
};

export default RichTextJournal;