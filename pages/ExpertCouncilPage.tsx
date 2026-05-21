import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { SparklesIcon, ChatIcon } from '../components/icons';
import { generateCloudflareText } from '../services/geminiService';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

interface Message {
  id: string;
  sender: 'user' | 'expert';
  text: string;
}

interface Expert {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatar: string;
  prompt: string;
  // Visual identity per expert
  avatarBg: string;
  avatarText: string;
  badge: string;
  tagline: string;
}

const experts: Expert[] = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    role: 'Biblical Scholar',
    specialty: 'Old Testament Context',
    avatar: 'SJ',
    avatarBg: 'bg-amber-500/15',
    avatarText: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-500',
    tagline: 'Ancient text, living word',
    prompt:
      'You are Dr. Sarah Jenkins, an expert Biblical Scholar specializing in Old Testament context. You provide deep, historically accurate, and spiritually enriching insights into scripture. Keep answers concise but profound.',
  },
  {
    id: '2',
    name: 'Rev. Marcus Cole',
    role: 'Pastoral Counselor',
    specialty: 'Grief & Loss',
    avatar: 'MC',
    avatarBg: 'bg-sky-500/15',
    avatarText: 'text-sky-500',
    badge: 'bg-sky-500/10 text-sky-500',
    tagline: 'Walking with you through pain',
    prompt:
      'You are Rev. Marcus Cole, a compassionate Pastoral Counselor specializing in grief, loss, and emotional healing. You offer gentle, empathetic, and faith-based comfort. Do not give medical advice.',
  },
  {
    id: '3',
    name: 'Dr. Emily Chen',
    role: 'Mental Health Professional',
    specialty: 'Anxiety & Faith',
    avatar: 'EC',
    avatarBg: 'bg-emerald-500/15',
    avatarText: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500',
    tagline: 'Where psychology meets faith',
    prompt:
      'You are Dr. Emily Chen, a Christian Mental Health Professional. You help people navigate anxiety and stress by combining psychological principles with faith-based encouragement. Do not diagnose or prescribe.',
  },
  {
    id: '4',
    name: 'Prof. David Alistair',
    role: 'Theologian',
    specialty: 'Early Church History',
    avatar: 'DA',
    avatarBg: 'bg-purple-500/15',
    avatarText: 'text-purple-500',
    badge: 'bg-purple-500/10 text-purple-500',
    tagline: 'Roots that shape the present',
    prompt:
      'You are Prof. David Alistair, a renowned Theologian specializing in Early Church History. You love explaining how early Christians lived and what we can learn from them today. You are academic yet accessible.',
  },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingDots: React.FC = () => (
  <div className="flex justify-start">
    <div className="bg-brand-secondary px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-brand-text-secondary rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ExpertCouncilPage: React.FC = () => {
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedExpert = experts.find((e) => e.id === selectedExpertId) ?? null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedExpertId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedExpert || isLoading) return;

    const newMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };

    setMessages((prev) => ({
      ...prev,
      [selectedExpert.id]: [...(prev[selectedExpert.id] || []), newMessage],
    }));
    setInput('');
    setIsLoading(true);

    try {
      const history = messages[selectedExpert.id] || [];
      const aiHistory = history.map((msg) => ({
        role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
        text: msg.text,
      }));

      const responseText = await generateCloudflareText({
        feature: 'expertCouncil',
        model: '@cf/meta/llama-3.1-8b-instruct',
        prompt: newMessage.text,
        history: aiHistory,
        systemInstruction: selectedExpert.prompt,
      });

      const expertReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: responseText || "I'm sorry, I couldn't process that right now.",
      };

      setMessages((prev) => ({
        ...prev,
        [selectedExpert.id]: [...(prev[selectedExpert.id] || []), expertReply],
      }));
    } catch {
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'expert',
        text: "I'm having trouble connecting right now. Please try again.",
      };
      setMessages((prev) => ({
        ...prev,
        [selectedExpert.id]: [...(prev[selectedExpert.id] || []), errorReply],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">
          Sanctuary
        </p>
        <h1
          className="text-4xl font-black text-brand-text-primary mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Expert Council
        </h1>
        <p className="text-brand-text-secondary">
          Four voices, one purpose — biblical depth, pastoral care, mental-health wisdom, and
          theological grounding. Ask any of them anything.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expert list */}
        <motion.div
          className="lg:col-span-1 space-y-3"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
            Choose an Expert
          </p>
          {experts.map((expert) => {
            const isSelected = selectedExpertId === expert.id;
            return (
              <motion.div key={expert.id} variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-brand-accent ring-1 ring-brand-accent'
                      : 'hover:border-brand-accent/40'
                  }`}
                  onClick={() => setSelectedExpertId(expert.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${expert.avatarBg} ${expert.avatarText}`}
                    >
                      {expert.avatar}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-brand-text-primary text-sm truncate">
                        {expert.name}
                      </h3>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${expert.badge}`}
                      >
                        {expert.role}
                      </span>
                      <p className="text-xs text-brand-text-secondary mt-1 leading-snug">
                        {expert.tagline}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Chat panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedExpert ? (
              <motion.div
                key={selectedExpert.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <Card className="h-[600px] flex flex-col">
                  {/* Chat header */}
                  <div className="border-b border-brand-border pb-4 mb-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${selectedExpert.avatarBg} ${selectedExpert.avatarText}`}
                      >
                        {selectedExpert.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-text-primary text-sm">
                          {selectedExpert.name}
                        </h3>
                        <p className={`text-xs font-semibold ${selectedExpert.avatarText}`}>
                          {selectedExpert.specialty}
                        </p>
                      </div>
                    </div>
                    <SparklesIcon className="w-4 h-4 text-brand-accent animate-pulse" />
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                    {/* Greeting */}
                    <div className="flex justify-start">
                      <div className="bg-brand-secondary px-4 py-3 rounded-2xl rounded-tl-none max-w-[82%]">
                        <p className="text-sm text-brand-text-primary leading-relaxed">
                          Hello! I am {selectedExpert.name}. How can I assist your journey today?
                        </p>
                      </div>
                    </div>

                    {(messages[selectedExpert.id] || []).map((msg) => (
                      <motion.div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div
                          className={`px-4 py-3 rounded-2xl max-w-[82%] text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-brand-accent text-white rounded-tr-sm'
                              : 'bg-brand-secondary text-brand-text-primary rounded-tl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && <TypingDots />}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="relative flex-shrink-0">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask ${selectedExpert.name.split(' ')[1]} anything…`}
                      disabled={isLoading}
                      className="w-full bg-brand-dark border border-brand-border rounded-xl py-3 pl-4 pr-12 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent rounded-lg text-white hover:bg-opacity-90 transition-opacity disabled:opacity-40"
                    >
                      <ChatIcon className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-[600px] flex flex-col items-center justify-center text-center px-8">
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {experts.map((e) => (
                      <div
                        key={e.id}
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base ${e.avatarBg} ${e.avatarText}`}
                      >
                        {e.avatar}
                      </div>
                    ))}
                  </div>
                  <h3
                    className="text-xl font-black text-brand-text-primary mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Choose your guide
                  </h3>
                  <p className="text-sm text-brand-text-secondary max-w-xs">
                    Select an expert from the left to begin a conversation shaped around your question.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExpertCouncilPage;
