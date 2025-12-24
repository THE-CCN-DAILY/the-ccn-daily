import React, { useMemo } from 'react';
import type { Highlight, ReaderSettings } from '../../types';

interface ReaderEngineProps {
    articleRef: React.RefObject<HTMLDivElement>;
    initialContent: string;
    highlights: Highlight[];
    settings: ReaderSettings;
}

const fontSizes = [14, 16, 18, 20, 24];
const lineSpacingClasses = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
};
const marginClasses = {
    normal: 'px-6',
    wide: 'px-10',
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ReaderEngine: React.FC<ReaderEngineProps> = ({ articleRef, initialContent, highlights, settings }) => {
    const readerPaneClass = `prose max-w-none ${settings.fontFamily} ${lineSpacingClasses[settings.lineSpacing]} transition-colors duration-300`;

    const renderedContent = useMemo(() => {
        if (!highlights || highlights.length === 0) {
            return <div dangerouslySetInnerHTML={{ __html: initialContent }} />;
        }
        
        let content = initialContent;
        
        // Sort highlights to process longer ones first, preventing substring issues where "he" would be highlighted inside "the".
        const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
        
        sortedHighlights.forEach(h => {
            // This regex splits the string by HTML tags, keeping the tags in the resulting array.
            const parts = content.split(/(<[^>]+>)/g);
            const escapedText = escapeRegExp(h.text);
            const replacement = `<mark class="highlight-mark highlight-mark-${h.color} cursor-pointer" data-highlight-id="${h.id}">${h.text}</mark>`;
            
            for (let i = 0; i < parts.length; i++) {
                // We only process the parts that are not tags.
                // In the split array, text nodes are at even indices (0, 2, 4, ...).
                if (i % 2 === 0) {
                    // This simple replace is now safe because we are operating on a chunk of text that contains no HTML tags.
                    parts[i] = parts[i].replace(new RegExp(escapedText, 'g'), replacement);
                }
            }
            
            content = parts.join('');
        });

        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }, [initialContent, highlights]);

    return (
        <article
            ref={articleRef}
            className={`flex-1 overflow-y-auto py-6 transition-colors duration-300 ${marginClasses[settings.margins]}`}
            style={{ 
              fontSize: `${fontSizes[settings.fontSize]}px`,
            }}
        >
            <div className={readerPaneClass}>
                {renderedContent}
            </div>
        </article>
    );
};

export default ReaderEngine;