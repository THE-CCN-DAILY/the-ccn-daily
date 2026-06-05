import React, { useMemo } from 'react';
import type { Highlight, ReaderSettings } from '../types';

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

const ReaderEngine: React.FC<ReaderEngineProps> = ({ articleRef, initialContent, highlights, settings }) => {
    const readerPaneClass = `prose ${settings.theme === 'dark' ? 'prose-invert' : ''} ${settings.theme === 'sepia' ? 'prose-sepia' : ''} max-w-none ${settings.fontFamily} ${lineSpacingClasses[settings.lineSpacing]} transition-all duration-300 prose-p:text-brand-text-primary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary`;

    const renderedContent = useMemo(() => {
        if (highlights.length === 0) {
            return <div dangerouslySetInnerHTML={{ __html: initialContent }} />;
        }
        let content = initialContent;
        // Sorting by length prevents smaller highlights from breaking larger ones during replacement.
        [...highlights]
            .sort((a, b) => b.text.length - a.text.length)
            .forEach(h => {
                const escapedText = h.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const replacement = `<mark class="highlight-mark highlight-mark-${h.color}">${h.text}</mark>`;
                content = content.replace(new RegExp(escapedText, "g"), replacement);
        });
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }, [initialContent, highlights]);

    return (
        <article
            ref={articleRef}
            className={`flex-1 overflow-y-auto py-6 ${marginClasses[settings.margins]}`}
            style={{ fontSize: `${fontSizes[settings.fontSize]}px` }}
        >
            <div className={readerPaneClass}>
                {renderedContent}
            </div>
        </article>
    );
};

export default ReaderEngine;
