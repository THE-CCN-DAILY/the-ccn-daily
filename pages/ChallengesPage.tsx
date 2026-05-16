import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { SparklesIcon, TeamIcon } from '../components/icons';
import { listChallenges, type Challenge } from '../services/challengeService';

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
        console.error('Failed to load challenges', error);
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
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary mb-4">Challenges</h1>
        <p className="text-xl text-brand-text-secondary">
          Join community-driven spiritual growth challenges. Build consistency together.
        </p>
      </div>

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
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      ) : displayChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayChallenges.map((challenge) => (
            <Card 
              key={challenge.id} 
              className="flex flex-col border-brand-border bg-brand-dark/30 overflow-hidden p-0 cursor-pointer hover:border-brand-accent/50 transition-colors group"
              onClick={() => navigate(`/app/challenges/${challenge.id}`)}
            >
              <div className="relative h-48 w-full bg-brand-secondary flex items-center justify-center overflow-hidden">
                {challenge.coverUrl ? (
                  <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <SparklesIcon className="w-12 h-12 text-brand-text-secondary/50" />
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">{challenge.title}</h3>
                </div>
                <p className="text-brand-text-secondary text-sm mb-6 flex-1 line-clamp-3">
                  {challenge.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border">
                  <div className="flex items-center text-brand-text-secondary text-sm">
                    <TeamIcon className="w-4 h-4 mr-2" />
                    {challenge.participantsCount} joined
                  </div>
                  <button className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors">
                    {activeTab === 'active' ? 'Join Now' : 'View Archive'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
          <SparklesIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-text-primary mb-2">No {activeTab} challenges</h3>
          <p className="text-brand-text-secondary">
            {activeTab === 'active' 
              ? "There are no active challenges at the moment. Check back soon!" 
              : "No past challenges found in the archive."}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ChallengesPage;
