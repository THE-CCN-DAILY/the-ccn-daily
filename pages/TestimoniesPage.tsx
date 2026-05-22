import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import { SparklesIcon, UserIcon, SendIcon } from '../components/icons';
import type { PrayerRequest, StandaloneTestimony } from '../types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// Placeholder testimonies — replace with live Firebase query when Testimonies collection is ready
const seedAnsweredPrayers: PrayerRequest[] = [
  {
    id: 5,
    text: 'For a job interview I had last week. Praying for favor and a positive outcome.',
    author: 'Emily R.',
    prayerCount: 51,
    testimony:
      "Thank you all for your prayers! I got the job! God is so faithful and truly opened the right doors. I'm so grateful for this community.",
  },
  {
    id: 6,
    text: "Please pray for my mother's surgery to go well and for a speedy recovery.",
    author: 'David L.',
    prayerCount: 103,
    testimony:
      'The surgery was a complete success, and my mom is recovering faster than the doctors expected. Your prayers made a tangible difference. All glory to God!',
  },
  {
    id: 7,
    text: 'I was struggling with a creative block on a very important project. Praying for a breakthrough.',
    author: 'Anonymous',
    prayerCount: 45,
    testimony:
      'The morning after I posted this, I woke up with a completely fresh perspective and finished the project that day. The block is gone! Thank you, Jesus.',
  },
];

// Seed testimonies — replace with live Firestore query when collection is live
const seedStandaloneTestimonies: StandaloneTestimony[] = [
  {
    id: 8,
    author: 'Maria G.',
    title: 'An Unexpected Reconciliation',
    text: "I hadn't spoken to my brother in years after a painful disagreement. I've been praying for restoration but didn't know how it could happen. Out of the blue, he called me. We had the most healing conversation we've had in a decade. A true miracle. Don't ever stop praying for restoration.",
  },
  {
    id: 9,
    author: 'Samuel T.',
    title: 'Gratitude for the "Small" Things',
    text: "Today I was just overwhelmed with gratitude. Not for any huge miracle, but for the warmth of the sun, the taste of my coffee, and the sound of my children laughing. It's in these small, everyday moments that I feel God's presence most profoundly. He is in everything.",
  },
];

type UnifiedTestimony = {
  id: string;
  author: string;
  testimonyText: string;
  contextTitle: string;
  contextText: string | null;
};

// ─── Share Story Modal ────────────────────────────────────────────────────────

const ShareStoryModal: React.FC<{
  onClose: () => void;
  onSave: (testimony: StandaloneTestimony) => void;
}> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleSave = () => {
    if (title.trim() && text.trim()) {
      onSave({ id: Date.now(), author: 'You', title, text });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-brand-secondary rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 m-0 sm:m-4"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-2xl font-black text-brand-text-primary mb-5 flex items-center gap-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <SparklesIcon className="w-6 h-6 text-brand-accent" />
          Share Your Story
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A title for your testimony"
            className="w-full bg-brand-dark border border-brand-border rounded-xl py-2.5 px-3 text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full p-3 bg-brand-dark border border-brand-border rounded-xl text-brand-text-primary placeholder-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            placeholder="Share your story of faith, gratitude, or a moment of God's goodness..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl text-brand-text-secondary hover:bg-brand-border transition-colors"
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSave}
            disabled={!title.trim() || !text.trim()}
            className="px-6 py-2.5 rounded-xl bg-brand-accent text-white font-semibold shadow-md disabled:opacity-40"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Share Story
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Testimony Card ───────────────────────────────────────────────────────────

const TestimonyCard: React.FC<{ testimony: UnifiedTestimony }> = ({ testimony }) => (
  <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
    <Card className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-brand-border gap-2">
        <h3 className="text-base font-bold text-brand-accent flex items-center gap-2 leading-snug">
          <SparklesIcon className="w-4 h-4 flex-shrink-0" />
          {testimony.contextTitle}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary flex-shrink-0">
          <UserIcon className="w-3.5 h-3.5" />
          <span>{testimony.author}</span>
        </div>
      </div>

      <div className="flex-grow space-y-3">
        <p className="text-brand-text-primary text-sm leading-relaxed">
          {testimony.testimonyText}
        </p>
        {testimony.contextText && (
          <div className="p-3 bg-brand-dark rounded-xl border border-brand-border">
            <p className="text-[12px] font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
              Original Prayer
            </p>
            <p className="text-xs text-brand-text-secondary italic leading-relaxed">
              "{testimony.contextText}"
            </p>
          </div>
        )}
      </div>
    </Card>
  </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const TestimoniesPage: React.FC = () => {
  const [standaloneTestimonies, setStandaloneTestimonies] = useState(seedStandaloneTestimonies);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const unifiedTestimonies = useMemo<UnifiedTestimony[]>(() => {
    const fromAnsweredPrayers: UnifiedTestimony[] = seedAnsweredPrayers
      .filter((r) => r.testimony)
      .map((r) => ({
        id: `p-${r.id}`,
        author: r.author,
        testimonyText: r.testimony!,
        contextTitle: 'Answered Prayer',
        contextText: r.text,
      }));

    const fromStandalone: UnifiedTestimony[] = standaloneTestimonies.map((t) => ({
      id: `s-${t.id}`,
      author: t.author,
      testimonyText: t.text,
      contextTitle: t.title,
      contextText: null,
    }));

    return [...fromStandalone, ...fromAnsweredPrayers].sort(
      (a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])
    );
  }, [standaloneTestimonies]);

  const handleSaveStory = (newStory: StandaloneTestimony) => {
    setStandaloneTestimonies([newStory, ...standaloneTestimonies]);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">
            Community
          </p>
          <h1
            className="text-4xl font-black text-brand-text-primary mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wall of Testimony
          </h1>
          <p className="text-brand-text-secondary max-w-xl">
            A space to celebrate God's faithfulness — answered prayers, quiet mercies, and the
            everyday moments that remind us He is near.
          </p>
        </div>

        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 px-6 py-3 rounded-full bg-brand-accent text-white font-bold shadow-lg flex items-center gap-2 self-start sm:self-auto"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <SendIcon className="w-4 h-4" />
          Share Your Story
        </motion.button>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {unifiedTestimonies.map((item) => (
          <TestimonyCard key={item.id} testimony={item} />
        ))}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ShareStoryModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveStory}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestimoniesPage;
