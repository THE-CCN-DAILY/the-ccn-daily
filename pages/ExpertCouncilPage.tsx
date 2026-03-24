import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { CommunityIcon, SparklesIcon, ChatIcon } from '../components/icons';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  sender: 'user' | 'expert';
  text: string;
}

const ExpertCouncilPage: React.FC = () => {
  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const experts = [
    { id: '1', name: 'Dr. Sarah Jenkins', role: 'Biblical Scholar', specialty: 'Old Testament Context', avatar: 'SJ', prompt: 'You are Dr. Sarah Jenkins, an expert Biblical Scholar specializing in Old Testament context. You provide deep, historically accurate, and spiritually enriching insights into scripture. Keep answers concise but profound.' },
    { id: '2', name: 'Rev. Marcus Cole', role: 'Pastoral Counselor', specialty: 'Grief & Loss', avatar: 'MC', prompt: 'You are Rev. Marcus Cole, a compassionate Pastoral Counselor specializing in grief, loss, and emotional healing. You offer gentle, empathetic, and faith-based comfort. Do not give medical advice.' },
    { id: '3', name: 'Dr. Emily Chen', role: 'Mental Health Professional', specialty: 'Anxiety & Faith', avatar: 'EC', prompt: 'You are Dr. Emily Chen, a Christian Mental Health Professional. You help people navigate anxiety and stress by combining psychological principles with faith-based encouragement. Do not diagnose or prescribe.' },
    { id: '4', name: 'Prof. David Alistair', role: 'Theologian', specialty: 'Early Church History', avatar: 'DA', prompt: 'You are Prof. David Alistair, a renowned Theologian specializing in Early Church History. You love explaining how early Christians lived and what we can learn from them today. You are academic yet accessible.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedExpert]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedExpert || isLoading) return;

    const expert = experts.find(e => e.id === selectedExpert);
    if (!expert) return;

    const newMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    
    setMessages(prev => ({
      ...prev,
      [selectedExpert]: [...(prev[selectedExpert] || []), newMessage]
    }));
    
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const history = messages[selectedExpert] || [];
      const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: newMessage.text }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents as any,
        config: {
          systemInstruction: expert.prompt
        }
      });

      const expertReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: response.text || "I'm sorry, I couldn't process that right now."
      };

      setMessages(prev => ({
        ...prev,
        [selectedExpert]: [...(prev[selectedExpert] || []), expertReply]
      }));
    } catch (error) {
      console.error("Error calling expert:", error);
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: "I'm having trouble connecting right now. Please try again later."
      };
      setMessages(prev => ({
        ...prev,
        [selectedExpert]: [...(prev[selectedExpert] || []), errorReply]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
          <CommunityIcon className="w-10 h-10 text-brand-accent"/>
          Expert Council Portal
        </h1>
        <p className="text-brand-text-secondary mt-2">Multi-persona AI guidance and community experts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4">Available Experts</h2>
          {experts.map(expert => (
            <Card 
              key={expert.id} 
              className={`cursor-pointer transition-all ${selectedExpert === expert.id ? 'border-brand-accent ring-1 ring-brand-accent' : 'hover:border-brand-accent/50'}`}
              onClick={() => setSelectedExpert(expert.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-lg">
                  {expert.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-brand-text-primary">{expert.name}</h3>
                  <p className="text-xs text-brand-accent">{expert.role}</p>
                  <p className="text-xs text-brand-text-secondary mt-1">{expert.specialty}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedExpert ? (
            <Card className="h-[600px] flex flex-col">
              <div className="border-b border-brand-border pb-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold">
                    {experts.find(e => e.id === selectedExpert)?.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-text-primary">{experts.find(e => e.id === selectedExpert)?.name}</h3>
                    <p className="text-xs text-brand-accent">Online - Ready to assist</p>
                  </div>
                </div>
                <SparklesIcon className="w-5 h-5 text-brand-accent animate-pulse" />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-dark/50 rounded-lg mb-4 custom-scrollbar">
                <div className="flex justify-start">
                  <div className="bg-brand-secondary p-3 rounded-2xl rounded-tl-none max-w-[80%]">
                    <p className="text-sm text-brand-text-primary">Hello! I am {experts.find(e => e.id === selectedExpert)?.name}. How can I assist you with your spiritual or personal journey today?</p>
                  </div>
                </div>
                
                {(messages[selectedExpert] || []).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[80%] ${
                      msg.sender === 'user' 
                        ? 'bg-brand-accent text-white rounded-tr-none' 
                        : 'bg-brand-secondary text-brand-text-primary rounded-tl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-brand-secondary p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for guidance..." 
                  disabled={isLoading}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 pl-4 pr-12 text-brand-text-primary focus:outline-none focus:border-brand-accent disabled:opacity-50"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent rounded-lg text-white hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  <ChatIcon className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex flex-col items-center justify-center text-center">
              <CommunityIcon className="w-16 h-16 text-brand-text-secondary mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-brand-text-primary mb-2">Select an Expert</h3>
              <p className="text-brand-text-secondary max-w-md">Choose from our panel of AI-powered biblical scholars, theologians, and counselors for personalized guidance.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertCouncilPage;
