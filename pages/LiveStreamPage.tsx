import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import { SpeakerWaveIcon, ChatIcon, UserCircleIcon, SparklesIcon } from '../components/icons';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import MuxPlayer from '@mux/mux-player-react';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  createdAt: any;
}

const LiveStreamPage: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'liveChat'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          user: data.user,
          text: data.text,
          time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: data.createdAt
        });
      });
      setChatMessages(messages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatMessage.trim() || !user) return;

    const messageText = chatMessage;
    setChatMessage('');

    try {
      await addDoc(collection(db, 'liveChat'), {
        user: user.displayName || 'Anonymous',
        userId: user.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
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
          <p className="text-brand-text-secondary mt-2">Low-latency audio/video streaming via Mux/Agora.</p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full font-bold animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            LIVE NOW
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden relative group">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <MuxPlayer
                streamType="live"
                playbackId="v00g01v000000000000000000000000000000000000000" // Replace with actual Mux playback ID
                metadata={{
                  video_id: 'sunday-gathering',
                  video_title: 'Sunday Gathering',
                  viewer_user_id: user?.uid || 'anonymous',
                }}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </Card>

          <div className="mt-6">
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2">The Power of Community</h3>
            <p className="text-brand-text-secondary">Join us as we explore the depths of faith and connection in today's digital age. This broadcast is streamed globally with real-time translation available.</p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <div className="border-b border-brand-border pb-4 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-brand-text-primary flex items-center gap-2">
                <ChatIcon className="w-5 h-5 text-brand-accent" />
                Live Chat
              </h3>
              <span className="text-xs font-bold text-brand-text-secondary bg-brand-secondary px-2 py-1 rounded-full">1.2k watching</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <UserCircleIcon className="w-8 h-8 text-brand-text-secondary flex-shrink-0" />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-brand-text-primary">{msg.user}</span>
                      <span className="text-[10px] text-brand-text-secondary">{msg.time}</span>
                    </div>
                    <p className="text-sm text-brand-text-secondary mt-1">{msg.text}</p>
                  </div>
                </div>
              ))}
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
