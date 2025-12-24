import React, { useState } from 'react';
import type { Highlight } from '../../types';
import { UiIcon, ChatBubbleLeftRightIcon } from '../icons';
import CommentsSection from '../shared/CommentsSection';
import HighlightsSidebar from '../HighlightsSidebar';

interface ReaderSidebarProps {
  highlights: Highlight[];
  editingHighlight: Highlight | null;
  onEditNote: (highlight: Highlight | null) => void;
  onSaveNote: (highlightId: string, noteText: string, voiceNoteUrl?: string, tags?: string[]) => void;
}

const ReaderSidebar: React.FC<ReaderSidebarProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'highlights' | 'comments'>('highlights');

    const TabButton: React.FC<{ label: string; icon: React.ElementType; name: typeof activeTab; }> = ({ label, icon: Icon, name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                activeTab === name
                ? 'text-brand-accent border-brand-accent'
                : 'text-brand-text-secondary border-transparent hover:text-brand-text-primary'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-brand-border flex items-center">
                <TabButton label="Smart Library" icon={UiIcon} name="highlights" />
                <TabButton label="Comments" icon={ChatBubbleLeftRightIcon} name="comments" />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'highlights' ? (
                    <HighlightsSidebar {...props} />
                ) : (
                    <CommentsSection contentId="epub-1" contentType="book" />
                )}
            </div>
        </div>
    );
};

export default ReaderSidebar;