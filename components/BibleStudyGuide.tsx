import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateCloudflareText } from '../services/geminiService';
import { ChatIcon, CloseIcon } from './icons';

interface BibleStudyGuideProps {
  currentPassage: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'expert';
  text: string;
}

interface Expert {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  prompt: string;
  avatarBg: string;
  avatarText: string;
  pillActive: string;
}

const EXPERTS: Expert[] = [
  {
    id: '1',
    name: 'Dr. Sarah',
    avatar: 'SJ',
    specialty: 'OT Scholar',
    avatarBg: 'bg-amber-500/15',
    avatarText: 'text-amber-500',
    pillActive: 'bg-amber-500 text-white',
    prompt:
      'You are Dr. Sarah Jenkins, an expert Biblical Scholar specializing in Old Testament context. You provide deep, historically accurate, and spiritually enriching insights into scripture. Keep answers concise but profound.',
  },
  {
    id: '2',
    name: 'Rev. Marcus',
    avatar: 'MC',
    specialty: 'Pastoral',
    avatarBg: 'bg-sky-500/15',
    avatarText: 'text-sky-500',
    pillActive: 'bg-sky-500 text-white',
    prompt:
      'You are Rev. Marcus Cole, a compassionate Pastoral Counselor specializing in grief, loss, and emotional healing. You offer gentle, empathetic, and faith-based comfort. Do not give medical advice.',
  },
  {
    id: '3',
    name: 'Dr. Emily',
    avatar: 'EC',
    specialty: 'Faith & Mind',
    avatarBg: 'bg-emerald-500/15',
    avatarText: 'text-emerald-500',
    pillActive: 'bg-emerald-500 text-white',
    prompt:
      'You are Dr. Emily Chen, a Christian Mental Health Professional. You help people navigate anxiety and stress by combining psychological principles with faith-based encouragement. Do not diagnose or prescribe.',
  },
  {
    id: '4',
    name: 'Prof. David',
    avatar: 'DA',
    specialty: 'Theologian',
    avatarBg: 'bg-purple-500/15',
    avatarText: 'text-purple-500',
    pillActive: 'bg-purple-500 text-white',
    prompt:
      'You are Prof. David Alistair, a renowned Theologian specializing in Early Church History. You love explaining how early Christians lived and what we can learn from them today. You are academic yet accessible.',
  },
];

const TypingDots: React.FC = () => (
  <div className="flex justify-start">
    <div className="bg-brand-secondary px-3 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1">
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-brand-text-secondary rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

const BibleStudyGuide: React.FC<BibleStudyGuideProps> = ({ currentPassage, onClose }) => {
  const [activeExpertId, setActiveExpertId] = useState<string>(EXPERTS[0].id);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const expert = EXPERTS.find((e) => e.id === activeExpertId) ?? EXPERTS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeExpertId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => ({
      ...prev,
      [expert.id]: [...(prev[expert.id] ?? []), userMsg],
    }));
    setInput('');
    setIsLoading(true);

    try {
      const history = messages[expert.id] ?? [];
      const aiHistory = history.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        text: m.text,
      }));

      const passageContext = currentPassage
        ? `\n\nContext: The user is currently reading ${currentPassage}. Help them understand this passage from your area of expertise.`
        : '';

      const responseText = await generateCloudflareText({
        feature: 'expertCouncil',
        model: '@cf/meta/llama-3.1-8b-instruct',
        prompt: userMsg.text,
        history: aiHistory,
        systemInstruction: expert.prompt + passageContext,
      });

      const expertReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: responseText || "I'm sorry, I couldn't process that right now.",
      };
      setMessages((prev) => ({
        ...prev,
        [expert.id]: [...(prev[expert.id] ?? []), expertReply],
      }));
    } catch {
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: "I'm having trouble connecting right now. Please try again.",
      };
      setMessages((prev) => ({
        ...prev,
        [expert.id]: [...(prev[expert.id] ?? []), errorReply],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const expertMessages = messages[expert.id] ?? [];

  return (
    <div className="h-full flex flex-col bg-brand-secondary border border-brand-border rounded-2xl overflow-hidden">
      {/* Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${expert.avatarBg} ${expert.avatarText}`}
          >
            {expert.avatar}
          </div>
          <div>
            <p className="text-xs font-bold text-brand-text-primary leading-none">{expert.name}</p>
            <p className={`text-[10px] font-semibold leading-none mt-0.5 ${expert.avatarText}`}>
              {expert.specialty}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          aria-label="Close study guide"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Expert pills */}
      <div className="flex-shrink-0 flex gap-1.5 px-3 py-2.5 border-b border-brand-border overflow-x-auto">
        {EXPERTS.map((e) => (
          <button
            key={e.id}
            onClick={() => setActiveExpertId(e.id)}
            className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${
              activeExpertId === e.id
                ? e.pillActive
                : 'bg-brand-dark text-brand-text-secondary hover:text-brand-text-primary border border-brand-border'
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* Passage context badge */}
      {currentPassage && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-brand-accent/10 border-b border-brand-accent/20">
          <p className="text-[10px] font-semibold text-brand-accent truncate">
            Studying: {currentPassage}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 px-3 py-3 min-h-0">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="bg-brand-dark px-3 py-2 rounded-2xl rounded-tl-none max-w-[88%]">
            <p className="text-xs text-brand-text-primary leading-relaxed">
              Hello! I am {expert.name}. How can I help you understand{' '}
              {currentPassage ? currentPassage : 'this passage'}?
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expertMessages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div
                className={`px-3 py-2 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-accent text-white rounded-tr-sm'
                    : 'bg-brand-dark text-brand-text-primary rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingDots />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-brand-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${expert.name}…`}
            disabled={isLoading}
            className="w-full bg-brand-dark border border-brand-border rounded-xl py-2.5 pl-3 pr-10 text-xs text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-accent rounded-lg text-white hover:bg-opacity-90 transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <ChatIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibleStudyGuide;
