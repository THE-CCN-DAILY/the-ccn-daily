import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Flame } from 'lucide-react';
import Card from '../components/Card';
import { TeamIcon } from '../components/icons';
import { listChallenges, type Challenge } from '../services/challengeService';

const EASE = [0.2, 0.6, 0.2, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

const ChallengesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setChallenges(await listChallenges());
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const activeChallenges = challenges.filter(c => {
    const startDate = new Date(c.startDate);
    // Consider it active if it started within the last 30 days or is in the future
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return startDate >= thirtyDaysAgo && c.status === 'published';
  });

  const archivedChallenges = challenges.filter(c => {
    const startDate = new Date(c.startDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return startDate < thirtyDaysAgo && c.status === 'published';
  });

  const displayChallenges = activeTab === 'active' ? activeChallenges : archivedChallenges;

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <p style={{ fontFamily: 'var(--sans-ui)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#E87A2C' }} className="mb-2">Community</p>
        <h1 className="text-4xl text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display, var(--font-display))', fontWeight: 600, lineHeight: 1.2 }}>
          Challenges
        </h1>
        <p style={{ fontFamily: 'var(--serif-body)', fontSize: '18px', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>Step into growth together — Scripture readings, prayer streaks, and community milestones.</p>
      </motion.div>

      <div className="flex gap-4 mb-8 border-b border-brand-border pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
            activeTab === 'active'
              ? 'bg-brand-accent text-white'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Active Challenges
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${
            activeTab === 'archive'
              ? 'bg-brand-accent text-white'
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Past Archive
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          <p className="text-sm text-brand-text-secondary" style={{ fontFamily: 'var(--serif-body)' }}>Loading the path ahead...</p>
        </div>
      ) : displayChallenges.length > 0 ? (
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={stagger} initial="hidden" animate="visible"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
        >
          {displayChallenges.map((challenge) => (
            <motion.div key={challenge.id} variants={fadeUp} transition={{ duration: 0.42, ease: EASE }}>
            <Card
              className="flex flex-col overflow-hidden p-0 cursor-pointer transition-colors group h-full"
              style={{ background: 'var(--bg-card, #FBF6EA)', boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))', borderRadius: '6px', borderTop: '2px solid #E87A2C' }}
              onClick={() => navigate(`/app/challenges/${challenge.id}`)}
            >
              <div className="relative h-48 w-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                {challenge.coverUrl ? (
                  <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--crimson, #8E1B1B)18', border: '1px solid var(--crimson, #8E1B1B)33' }}>
                    <Target className="w-8 h-8" style={{ color: 'var(--crimson, #8E1B1B)' }} />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl group-hover:text-brand-accent transition-colors" style={{ fontFamily: 'var(--serif-display, var(--font-display))', fontWeight: 600, color: 'var(--fg-1, #2A1C15)' }}>{challenge.title}</h3>
                </div>
                <p className="mb-6 flex-1 line-clamp-3" style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>
                  {challenge.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border">
                  <div className="flex items-center text-sm" style={{ fontFamily: 'var(--sans-ui)', color: 'var(--fg-3, #8A7A6A)' }}>
                    <TeamIcon className="w-4 h-4 mr-2" />
                    {challenge.participantsCount} joined
                  </div>
                  <button className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                    {activeTab === 'active' ? 'Join Now' : 'View Archive'}
                  </button>
                </div>
              </div>
            </Card>
            </motion.div>
          ))}
        </motion.div>
        </AnimatePresence>
      ) : (
        <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--crimson, #8E1B1B)18', border: '1px solid var(--crimson, #8E1B1B)33' }}>
            <Flame className="w-8 h-8" style={{ color: 'var(--crimson, #8E1B1B)' }} />
          </div>
          <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--serif-display, var(--font-display))', fontWeight: 600, color: 'var(--fg-1, #2A1C15)' }}>No {activeTab} challenges</h3>
          <p style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>
            {activeTab === 'active'
              ? "No active challenges — a new one is on the way."
              : "No past challenges found in the archive."}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ChallengesPage;
