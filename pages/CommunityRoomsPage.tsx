import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '../components/icons';
import { CommunityMessage, listCommunityMessages, sendCommunityMessage } from '../services/communityService';

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
        const fetchedMessages = await listCommunityMessages(50);
        if (!cancelled) setMessages(fetchedMessages);
      } catch (error) {
        console.error('Failed to load community room messages:', error);
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
      if (sentMessage) setMessages(prev => [...prev, sentMessage]);
    } catch (error) {
      console.error('Failed to send community room message:', error);
      setError(error instanceof Error ? error.message : 'Message could not be sent.');
      setNewMessage(messageText);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-4xl font-black text-brand-text-primary mb-2 flex items-center">
          <ChatBubbleLeftRightIcon className="w-10 h-10 mr-4 text-brand-accent" />
          The Sanctuary Room
        </h1>
        <p className="text-xl text-brand-text-secondary">
          Connect, pray, and grow with the global community.
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-brand-border bg-brand-dark/50 overflow-hidden p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <Card className="border-status-warning/40 bg-status-warning/10">
              <p className="text-sm text-brand-text-secondary">{error}</p>
            </Card>
          )}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.userId === user?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="text-xs font-bold text-brand-text-secondary">
                      {isMe ? 'You' : msg.user}
                    </span>
                    <span className="text-[10px] text-brand-text-secondary/50">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                      isMe 
                        ? 'bg-brand-accent text-white rounded-tr-sm' 
                        : 'bg-brand-secondary text-brand-text-primary border border-brand-border rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-brand-text-secondary">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>No messages yet. Be the first to say hello!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-brand-dark border-t border-brand-border">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share a thought, prayer, or encouragement..."
              className="flex-1 bg-brand-secondary border border-brand-border rounded-full px-6 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center disabled:opacity-50 hover:bg-opacity-90 transition-colors flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CommunityRoomsPage;
