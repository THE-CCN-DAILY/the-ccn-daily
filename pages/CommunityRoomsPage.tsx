import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '../components/icons';
import { type CommunityMessage, listCommunityMessages, sendCommunityMessage } from '../services/communityService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Deterministic avatar color from user name
const AVATAR_COLORS = [
  'bg-sky-500/20 text-sky-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-purple-500/20 text-purple-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
  'bg-teal-500/20 text-teal-400',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime(timestamp?: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CommunityRoomsPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      setError('');
      try {
        const fetched = await listCommunityMessages(50);
        if (!cancelled) setMessages(fetched);
      } catch {
        if (!cancelled) setError('Messages could not be refreshed. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMessages(true);
    const interval = window.setInterval(() => loadMessages(false), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const sentMessage = await sendCommunityMessage({
        user: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userId: user.uid,
        text: messageText,
      });
      if (sentMessage) setMessages((prev) => [...prev, sentMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be sent.');
      setNewMessage(messageText);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <motion.div
        className="mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ fontFamily: 'var(--sans-ui)', color: 'var(--amber-ds, #E87A2C)' }}
        >
          Community
        </p>
        <h1
          className="text-4xl font-black text-brand-text-primary mb-2"
          style={{ fontFamily: 'var(--serif-display)' }}
        >
          The Sanctuary Room
        </h1>
        <p className="text-brand-text-secondary">
          A live space to pray, encourage, and share with the global CCN family.
        </p>
      </motion.div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-brand-text-secondary bg-status-warning/10 border border-status-warning/30 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
              <p className="text-xs text-brand-text-secondary" style={{ fontFamily: 'var(--serif-body)' }}>Looking for open rooms...</p>
            </div>
          ) : messages.length > 0 ? (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMe = msg.userId === user?.uid;
                const displayName = isMe ? 'You' : msg.user;
                const colorClass = isMe ? '' : avatarColor(msg.user);
                const abbrev = initials(msg.user || 'A');

                return (
                  <motion.div
                    key={msg.id}
                    className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Avatar — only for other users */}
                    {!isMe && (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-5 ${colorClass}`}
                      >
                        {abbrev}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]`}>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-xs font-bold text-brand-text-secondary">
                          {displayName}
                        </span>
                        <span className="text-[12px] text-brand-text-secondary/50">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-brand-accent text-white rounded-tr-sm'
                            : 'bg-brand-secondary text-brand-text-primary border border-brand-border rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-brand-text-secondary py-12">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-sm" style={{ fontFamily: 'var(--serif-body)' }}>Community forms where we show up. Be the first.</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-brand-dark border-t border-brand-border flex-shrink-0">
          <p className="text-[11px] text-brand-text-secondary/50 flex items-center gap-1 mb-2">
            <span aria-hidden>🎙</span>
            Type or use your phone's microphone to speak.
          </p>
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share a thought, prayer, or encouragement…"
              className="flex-1 bg-brand-secondary border border-brand-border rounded-full px-5 py-2.5 text-sm text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-11 h-11 rounded-full bg-brand-accent text-white flex items-center justify-center disabled:opacity-40 hover:bg-opacity-90 transition-opacity flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CommunityRoomsPage;
