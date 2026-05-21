import React, { useState } from 'react';
import { SendIcon, SpinnerIcon } from '../icons';
import type { Comment } from '../../types';
import { useGamification } from '../../contexts/GamificationContext';

interface CommentsSectionProps {
    contentId: string;
    contentType: 'podcast' | 'book';
    isPlayer?: boolean; // Special styling for the dark player UI
}

const mockComments: Comment[] = [
    { id: '1', author: 'Sarah K.', avatar: 'https://picsum.photos/seed/sarah/100', text: 'This was so timely. The distinction between holy and worldly ambition is something I\'ve been wrestling with. Thank you for the clarity!', timestamp: '2 hours ago' },
    { id: '2', author: 'John D.', avatar: 'https://picsum.photos/seed/john/100', text: 'The Nehemiah example really hit home for me. It\'s about rebuilding what matters to God, not just building a career. Powerful message.', timestamp: '5 hours ago' },
    { id: '3', author: 'Anonymous', avatar: '', text: 'I needed to hear this today. "Your current season is a training ground" - that line is going to stick with me all week.', timestamp: '1 day ago' },
];

const CommentsSection: React.FC<CommentsSectionProps> = ({ contentId, contentType, isPlayer = false }) => {
    const [comments, setComments] = useState<Comment[]>(mockComments);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const { dispatchGamificationEvent } = useGamification();

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isPosting) return;
        
        setIsPosting(true);
        await new Promise(res => setTimeout(res, 750));

        const newCommentObject: Comment = {
            id: Date.now().toString(),
            author: 'Founder (You)',
            avatar: 'https://picsum.photos/seed/founder/100',
            text: newComment,
            timestamp: 'Just now',
        };
        
        setComments(prev => [newCommentObject, ...prev]);
        setNewComment('');
        setIsPosting(false);
        
        // Award points for commenting
        dispatchGamificationEvent('e6');
    };
    
    const baseTextColor = isPlayer ? 'text-white/80' : 'text-brand-text-secondary';
    const strongTextColor = isPlayer ? 'text-white/90' : 'text-brand-text-primary';
    const weakTextColor = isPlayer ? 'text-white/50' : 'text-brand-text-secondary/70';
    const formBgColor = isPlayer ? 'bg-black/30' : 'bg-brand-secondary';
    const formBorderColor = isPlayer ? 'border-white/20' : 'border-brand-border';
    const formFocusRingColor = isPlayer ? 'focus:ring-brand-accent' : 'focus:ring-brand-accent';
    const submitBtnColor = isPlayer ? 'bg-brand-accent text-brand-dark' : 'bg-brand-accent text-white';

    return (
        <div className="animate-fade-in-up flex flex-col h-full" style={{animationDuration: '0.3s'}}>
            <ul className="space-y-4 flex-1 overflow-y-auto -mr-2 pr-2">
                {comments.map(comment => (
                    <li key={comment.id} className="flex items-start gap-3">
                        <img 
                            src={comment.author === 'Anonymous' ? undefined : comment.avatar}
                            alt={comment.author}
                            className={`w-8 h-8 rounded-full ${isPlayer ? 'bg-white/20' : 'bg-brand-secondary'} mt-1`}
                        />
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className={`font-semibold ${strongTextColor} text-sm`}>{comment.author}</span>
                                <span className={`text-xs ${weakTextColor}`}>{comment.timestamp}</span>
                            </div>
                            <p className={baseTextColor}>{comment.text}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <form onSubmit={handlePostComment} className={`mt-4 flex items-start gap-3 ${isPlayer ? 'border-t border-white/10 pt-4' : ''}`}>
                <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    placeholder="Share your thoughts..."
                    className={`flex-1 border rounded-lg p-2 text-sm placeholder:text-opacity-50 focus:outline-none focus:ring-1 resize-none
                        ${formBgColor}
                        ${formBorderColor}
                        ${strongTextColor}
                        ${formFocusRingColor}
                    `}
                    disabled={isPosting}
                />
                <button 
                    type="submit" 
                    className={`p-2 rounded-full disabled:opacity-50
                        ${submitBtnColor}
                    `}
                    disabled={!newComment.trim() || isPosting}
                    aria-label="Post comment"
                >
                    {isPosting ? <SpinnerIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5"/>}
                </button>
            </form>
        </div>
    );
};

export default CommentsSection;