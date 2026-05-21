import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { SpeakerWaveIcon, ChatIcon, UserCircleIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import MuxPlayer from '@mux/mux-player-react';
import {
  LiveStreamMessage,
  getLiveStreamStatus,
  listLiveStreamMessages,
  sendLiveStreamMessage,
} from '../services/liveStreamService';

const LiveStreamPage: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<LiveStreamMessage[]>([]);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamError, setStreamError] = useState('');
  const [chatError, setChatError] = useState('');
  const [loadingChat, setLoadingChat] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setStreamError('');
      try {
        const stream = await getLiveStreamStatus();
        if (cancelled) return;
        setPlaybackId(stream.playbackId || null);
        setIsLive(stream.isLive);
        setViewerCount(stream.viewerCount || 0);
      } catch {
        if (!cancelled) {
          setStreamError('Live stream status could not be refreshed.');
          setIsLive(false);
          setPlaybackId(null);
        }
      }
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async (showSpinner = false) => {
      if (showSpinner) setLoadingChat(true);
      setChatError('');
      try {
        const messages = await listLiveStreamMessages(100);
        if (!cancelled) {
          setChatMessages(messages);
          scrollToBottom();
        }
      } catch {
        if (!cancelled) setChatError('Live chat could not be refreshed.');
      } finally {
        if (!cancelled) setLoadingChat(false);
      }
    };

    loadMessages(true);
    const interval = window.setInterval(() => loadMessages(false), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatMessage.trim() || !user) return;

    const messageText = chatMessage;
    setChatMessage('');

    try {
      const sentMessage = await sendLiveStreamMessage({
        user: user.displayName || 'Anonymous',
        userId: user.uid,
        text: messageText,
      });
      if (sentMessage) setChatMessages(prev => [...prev, sentMessage]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Message could not be sent.');
      setChatMessage(messageText);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
            <SpeakerWaveIcon className="w-10 h-10 text-brand-accent"/>
            Global Broadcast
          </h1>
          <p className="text-brand-text-secondary mt-2">
            Join us live — worship, teaching, and community broadcast in real time.
          </p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full font-bold animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            LIVE NOW
          </div>
        )}
      </div>
      {streamError && (
        <Card className="mb-6 border-status-warning/40 bg-status-warning/10">
          <p className="text-sm text-brand-text-secondary">{streamError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden relative group">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {playbackId ? (
                <MuxPlayer
                  streamType="live"
                  playbackId={playbackId}
                  metadata={{
                    video_id: 'sunday-gathering',
                    video_title: 'Sunday Gathering',
                    viewer_user_id: user?.uid || 'anonymous',
                  }}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <SpeakerWaveIcon className="w-16 h-16 text-brand-text-secondary mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-brand-text-primary mb-2">Broadcast Offline</h3>
                  <p className="text-brand-text-secondary">No broadcast is live right now. Come back for the next gathering.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="mt-6">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Gathering Together</h3>
            <p className="text-brand-text-secondary">A global moment of worship and teaching, live from our community. Watch here, pray alongside thousands, and join the chat below.</p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <div className="border-b border-brand-border pb-4 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-brand-text-primary flex items-center gap-2">
                <ChatIcon className="w-5 h-5 text-brand-accent" />
                Live Chat
              </h3>
              <span className="text-xs font-bold text-brand-text-secondary bg-brand-secondary px-2 py-1 rounded-full">{viewerCount.toLocaleString()} watching</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {chatError && (
                <Card className="border-status-warning/40 bg-status-warning/10">
                  <p className="text-sm text-brand-text-secondary">{chatError}</p>
                </Card>
              )}
              {loadingChat ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-accent"></div>
                </div>
              ) : chatMessages.length > 0 ? chatMessages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <UserCircleIcon className="w-8 h-8 text-brand-text-secondary flex-shrink-0" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-brand-text-primary">{msg.user}</span>
                      <span className="text-[10px] text-brand-text-secondary">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-brand-text-secondary mt-1">{msg.text}</p>
                  </div>
                </div>
              )) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-brand-text-secondary">
                  <ChatIcon className="mb-4 h-10 w-10 opacity-40" />
                  <p>No live chat messages yet.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="relative mt-auto">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={user ? "Say something..." : "Sign in to chat"} 
                disabled={!user}
                className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 pl-4 pr-12 text-brand-text-primary focus:outline-none focus:border-brand-accent disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!user || !chatMessage.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent rounded-lg text-white hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;
