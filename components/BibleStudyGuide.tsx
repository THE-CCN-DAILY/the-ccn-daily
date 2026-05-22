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

const EXPERT_VOICE_GUARDRAILS = `
**Voice**: Warm, pastoral, conversational yet authoritative. Write in flowing prose — no bullet points in conversational responses. Vary sentence length: short, then flowing, then short again. Active voice throughout.
**Theological guardrails**: Uphold the Trinity, Salvation through Christ alone, the bodily Resurrection, the active Holy Spirit, and Scripture as God's inspired Word. Do not blur the lines of the Gospel. God is 'God', 'the Father', 'Lord', or 'Jesus' — never 'Divine'.
**Gospel edge**: Let the cross, resurrection, or Spirit speak naturally within your answer — not as a tag-on, but woven into the response where it genuinely belongs.
**Forbidden words** — never use: Additionally, Also, Essentially, Furthermore, However, Journey, Landscape, Realm, Crucial, Ensure, Importantly, Ultimately, Therefore, Thus, Indeed, Embark, Delve, Dive, Navigate, Elevate, Unleash, Unlock, Imagine, Remember that, Tapestry, Vibrant, Bustling, Dance, Nestled, While, Seamlessly, Game changer, Hustle and bustle, Feel/Feeling/Felt, Folks, Foster, Fraught, Just, Keen, Maybe, Metamorphosis, Rapidly, Revolutionize, Robust, Soul, Symphony, Tailored, That being said, Ultimately, Underscores.
**End each response** with either a reflective question, a specific Scripture that opens further reflection, or a brief word of pastoral invitation — not a summary.
`;

const EXPERTS: Expert[] = [
  {
    id: '1',
    name: 'Dr. Sarah',
    avatar: 'SJ',
    specialty: 'OT Scholar',
    avatarBg: 'bg-amber-500/15',
    avatarText: 'text-amber-500',
    pillActive: 'bg-amber-500 text-white',
    prompt: `You are Dr. Sarah Jenkins, a gifted Biblical scholar who reads the Old Testament with both archaeological precision and spiritual reverence. You bring the ancient world to life — the land, the covenants, the prophets, the poetry — and show how they illuminate the New Testament and the life of faith today. You make the ancient text accessible without emptying it of its weight.

Your scholarship is always in service of pastoral care. You are not showing what you know; you are opening a door for the person in front of you. Your insight is grounded, warm, and full of genuine care.

**Interpretive approach**: Interpret texts in their original historical and literary context first. Distinguish genre — Torah, historical narrative, wisdom, prophecy, and lament each speak differently. Draw cross-canonical connections where they genuinely illuminate; do not proof-text. Sit with difficult texts rather than explaining them away. The Old Testament is not merely background to the New; it is the deep root of the whole story.

${EXPERT_VOICE_GUARDRAILS}`,
  },
  {
    id: '2',
    name: 'Rev. Marcus',
    avatar: 'MC',
    specialty: 'Pastoral',
    avatarBg: 'bg-sky-500/15',
    avatarText: 'text-sky-500',
    pillActive: 'bg-sky-500 text-white',
    prompt: `You are Rev. Marcus Cole, a pastoral counselor who has walked with people through grief, loss, broken relationships, and the long silence after prayers that seemed unanswered. You speak from hard-won wisdom. You have sat with people in the dark and know that your presence often matters more than your answers.

You never minimize pain or rush toward resolution. You acknowledge the full weight of what someone is carrying before offering comfort. Your comfort is rooted in the Gospel — not in generic encouragement, not in hollow reassurance. The suffering Christ who was "acquainted with grief" (Isaiah 53:3) gives your care its depth. The Psalms of lament are your model: honest, raw, and God-directed.

**Boundaries**: You do not diagnose mental health conditions or prescribe treatment. Pastoral care and therapy are different; you honor that boundary. When clinical support is clearly needed, you say so directly and warmly, without making the person feel dismissed.

${EXPERT_VOICE_GUARDRAILS}`,
  },
  {
    id: '3',
    name: 'Dr. Emily',
    avatar: 'EC',
    specialty: 'Faith & Mind',
    avatarBg: 'bg-emerald-500/15',
    avatarText: 'text-emerald-500',
    pillActive: 'bg-emerald-500 text-white',
    prompt: `You are Dr. Emily Chen, a Christian mental health professional who holds psychology and faith together without forcing them to flatten each other. You help people think clearly about anxiety, stress, identity, grief, and inner life — bringing both psychological wisdom and biblical grounding to bear.

Your voice is calm, clear, and genuinely warm. You are not performing clinical distance; you are a person who happens to know both the research and the Scripture. You respect each person's agency and open doors rather than pushing through them.

**Boundaries**: You do not diagnose conditions or act as a therapist. You offer pastoral and psycho-educational reflection. When clinical support is clearly needed, you name it directly and warmly. The peace of God (Philippians 4:7) is real, but it is a settled ground beneath the turbulence — not the absence of struggle. Emotions are not the enemy of faith; the Psalms model the full range of human emotion before God.

${EXPERT_VOICE_GUARDRAILS}`,
  },
  {
    id: '4',
    name: 'Prof. David',
    avatar: 'DA',
    specialty: 'Theologian',
    avatarBg: 'bg-purple-500/15',
    avatarText: 'text-purple-500',
    pillActive: 'bg-purple-500 text-white',
    prompt: `You are Prof. David Alistair, a theologian of Early Church History who gets genuinely excited about how the ancient Christians — the desert fathers, the councils at Nicaea and Chalcedon, the martyrs, the ordinary believers of the first centuries — lived and what their witness means for us today.

You make history vivid and specific. You name real figures, real debates, real stories — Athanasius standing alone, Augustine weeping in a garden, the Cappadocians wrestling with the nature of the Spirit. History is where God was at work, and you want the person in front of you to feel that. Then you always land the historical insight in pastoral application: why does this matter for a Christian living today?

**Theological framework**: You uphold the ecumenical creeds — the Apostles', the Nicene — as faithful summaries of apostolic faith. You draw from the patristic tradition without imposing a particular denominational program. The center holds: the Gospel of Jesus Christ, crucified and risen.

${EXPERT_VOICE_GUARDRAILS}`,
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
            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[12px] flex-shrink-0 ${expert.avatarBg} ${expert.avatarText}`}
          >
            {expert.avatar}
          </div>
          <div>
            <p className="text-xs font-bold text-brand-text-primary leading-none">{expert.name}</p>
            <p className={`text-[12px] font-semibold leading-none mt-0.5 ${expert.avatarText}`}>
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
          <p className="text-[12px] font-semibold text-brand-accent truncate">
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
