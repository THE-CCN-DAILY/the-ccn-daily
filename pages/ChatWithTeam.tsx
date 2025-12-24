import React, { useState, useRef, useEffect } from 'react';
import { getAiCoachResponse } from '../services/geminiService';
import { SendIcon, TeamIcon, LogoIcon, ClockIcon } from '../components/icons';
import Card from '../components/Card';
import type { Message } from '../types';

const ChatWithTeam: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
      { sender: 'ai', text: "Hello Founder. It's good to connect with you again. I've been reflecting on our previous conversations about courage and leadership. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    const currentHistory = messages;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await getAiCoachResponse(input, currentHistory);
      const aiMessage: Message = { sender: 'ai', text: responseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Sorry, I couldn't get a response. Please check your API key setup. Error: ${errorMessage}`);
       setMessages(currentHistory); // Roll back optimistic update on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  const mockHistory = [
      "Discussed the importance of courage in the devotional generator.",
      "Talked about the theme of forgiveness in the 'Holy Ambition' podcast.",
      "Planned the UI for the 'Smart Library' notes feature.",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">AI Coach Prototype</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This chat now simulates the AI Coach's new long-term memory capabilities.
      </p>

    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <Card className="lg:col-span-2 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && <LogoIcon className="w-8 h-8 text-brand-accent flex-shrink-0" />}
                <div className={`max-w-lg p-3 rounded-xl ${msg.sender === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-secondary'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                <LogoIcon className="w-8 h-8 text-brand-accent flex-shrink-0 animate-pulse" />
                <div className="max-w-lg p-3 rounded-xl bg-brand-secondary">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"></div>
                    </div>
                </div>
                </div>
            )}
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 p-4 border-t border-brand-border">
            <div className="relative">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Continue your conversation..."
                className="w-full bg-brand-secondary border border-brand-border rounded-full py-3 pl-5 pr-14 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                disabled={isLoading}
                />
                <button
                onClick={handleSend}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-accent hover:bg-brand-accent-dark disabled:bg-brand-secondary transition-colors"
                >
                <SendIcon className="w-6 h-6 text-white" />
                </button>
            </div>
            </div>
        </Card>
        <Card className="flex flex-col">
            <h3 className="text-lg font-bold text-brand-text-primary mb-4 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-brand-accent" />
                Conversation History
            </h3>
            <p className="text-sm text-brand-text-secondary mb-4">The AI Coach now remembers key topics from your past conversations to provide a more continuous experience.</p>
            <div className="flex-1 overflow-y-auto -mr-3 pr-3 space-y-3">
                {mockHistory.map((item, index) => (
                     <div key={index} className="p-3 bg-brand-secondary/50 rounded-lg text-sm text-brand-text-secondary">
                        - {item}
                    </div>
                ))}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatWithTeam;