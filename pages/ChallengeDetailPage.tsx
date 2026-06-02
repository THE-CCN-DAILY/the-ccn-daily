import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Target } from 'lucide-react';
import { TeamIcon, CheckIcon, ChevronLeftIcon, PlayIcon } from '../components/icons';
import Card from '../components/Card';
import {
  getChallengeDetail,
  joinChallenge,
  type Challenge,
  type ChallengeModule,
} from '../services/challengeService';

const ChallengeDetailPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [modules, setModules] = useState<ChallengeModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!challengeId || !user) return;

    const fetchChallengeData = async () => {
      try {
        const data = await getChallengeDetail(challengeId, user.uid);
        setChallenge(data.challenge);
        setModules(data.modules);
        setIsParticipant(Boolean(data.participant));
        setCompletedModules(data.participant?.completedModules || []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [challengeId, user]);

  const handleJoinChallenge = async () => {
    if (!challengeId || !user || !challenge) return;
    setJoining(true);

    try {
      const result = await joinChallenge(challengeId, user.uid);
      setIsParticipant(true);
      setCompletedModules(result.participant?.completedModules || []);
      if (result.challenge) setChallenge(result.challenge);

    } catch (error) {
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Challenge Not Found</h2>
        <button onClick={() => navigate('/app/challenges')} className="text-brand-accent hover:underline">
          Return to Challenges
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate('/app/challenges')}
        className="flex items-center text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Challenges
      </button>

      <Card className="overflow-hidden p-0 border-brand-border bg-brand-dark/30 mb-8">
        {challenge.coverUrl ? (
          <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-64 bg-brand-secondary flex items-center justify-center">
            <Target className="w-16 h-16 text-brand-text-secondary/50" />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-brand-text-primary mb-2">{challenge.title}</h1>
              <div className="flex items-center text-brand-text-secondary">
                <TeamIcon className="w-5 h-5 mr-2" />
                <span className="font-bold">{challenge.participantsCount}</span>&nbsp;participants
              </div>
            </div>
            
            {!isParticipant ? (
              <button 
                onClick={handleJoinChallenge}
                disabled={joining}
                className="px-8 py-3 bg-brand-accent text-white rounded-full font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {joining ? 'Joining...' : 'Join Challenge'}
              </button>
            ) : (
              <div className="px-6 py-3 bg-green-900/30 text-green-400 border border-green-500/30 rounded-full font-bold flex items-center flex-shrink-0">
                <CheckIcon className="w-5 h-5 mr-2" />
                You're In!
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            <h3 className="text-xl font-bold text-brand-text-primary mb-4">About this Challenge</h3>
            <p className="text-brand-text-secondary whitespace-pre-wrap leading-relaxed">
              {challenge.description}
            </p>
          </div>
        </div>
      </Card>

      {isParticipant && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-brand-text-primary">Challenge Modules</h2>
          
          {modules.length > 0 ? (
            <div className="space-y-4">
              {modules.map((module) => {
                const isCompleted = completedModules.includes(module.id);
                return (
                  <div 
                    key={module.id} 
                    onClick={() => navigate(`/app/challenges/${challengeId}/modules/${module.id}`)}
                    className={`flex items-center justify-between p-6 rounded-xl border cursor-pointer transition-colors ${
                      isCompleted 
                        ? 'border-green-500/30 bg-green-900/10 hover:border-green-500/50' 
                        : 'border-brand-border bg-brand-dark/30 hover:border-brand-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-black ${
                        isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-brand-secondary text-brand-text-primary'
                      }`}>
                        {isCompleted ? <CheckIcon className="w-6 h-6" /> : module.dayNumber}
                      </div>
                      <div>
                        <h4 className={`font-bold ${isCompleted ? 'text-brand-text-secondary' : 'text-brand-text-primary'}`}>
                          {module.title}
                        </h4>
                        <p className="text-sm text-brand-text-secondary mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-brand-accent/10 text-brand-accent'
                      }`}>
                        <PlayIcon className="w-5 h-5 ml-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="border-brand-border bg-brand-dark/30 text-center py-12">
              <Target className="w-12 h-12 text-brand-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-text-primary mb-2">Modules Unlocking Soon</h3>
              <p className="text-brand-text-secondary">
                The daily content for this challenge will appear here once it begins.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeDetailPage;
