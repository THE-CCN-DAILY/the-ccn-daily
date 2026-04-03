import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { ChevronLeftIcon, CheckIcon, PlayIcon, SpeakerWaveIcon } from '../components/icons';
import Card from '../components/Card';
import Markdown from 'react-markdown';

interface ChallengeModule {
  id: string;
  title: string;
  description: string;
  content: string;
  dayNumber: number;
  videoUrl?: string;
  audioUrl?: string;
}

const ChallengeModuleViewerPage: React.FC = () => {
  const { challengeId, moduleId } = useParams<{ challengeId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [module, setModule] = useState<ChallengeModule | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!challengeId || !moduleId || !user) return;

    const fetchModuleData = async () => {
      try {
        // Fetch module details
        const docRef = doc(db, `challenges/${challengeId}/modules`, moduleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setModule({ id: docSnap.id, ...docSnap.data() } as ChallengeModule);
        }

        // Check completion status
        const participantRef = doc(db, `challenges/${challengeId}/participants`, user.uid);
        const participantSnap = await getDoc(participantRef);
        if (participantSnap.exists()) {
          const completed = participantSnap.data().completedModules || [];
          setIsCompleted(completed.includes(moduleId));
        }

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `challenges/${challengeId}/modules/${moduleId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [challengeId, moduleId, user]);

  const handleMarkComplete = async () => {
    if (!challengeId || !moduleId || !user || isCompleted) return;
    setCompleting(true);

    try {
      const participantRef = doc(db, `challenges/${challengeId}/participants`, user.uid);
      await updateDoc(participantRef, {
        completedModules: arrayUnion(moduleId)
      });
      setIsCompleted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `challenges/${challengeId}/participants`);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Module Not Found</h2>
        <button onClick={() => navigate(`/app/challenges/${challengeId}`)} className="text-brand-accent hover:underline">
          Return to Challenge
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <button 
        onClick={() => navigate(`/app/challenges/${challengeId}`)}
        className="flex items-center text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Modules
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-brand-accent/20 text-brand-accent text-sm font-bold rounded-full">
            Day {module.dayNumber}
          </span>
          {isCompleted && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full flex items-center gap-1">
              <CheckIcon className="w-4 h-4" /> Completed
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-brand-text-primary mb-4">{module.title}</h1>
        <p className="text-xl text-brand-text-secondary">{module.description}</p>
      </div>

      {module.videoUrl && (
        <Card className="p-0 overflow-hidden border-brand-border bg-brand-dark/30 mb-8">
          <div className="aspect-video bg-black flex items-center justify-center relative group">
            <video 
              src={module.videoUrl} 
              controls 
              className="w-full h-full object-contain"
              poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            />
          </div>
        </Card>
      )}

      {module.audioUrl && !module.videoUrl && (
        <Card className="border-brand-border bg-brand-dark/30 mb-8 flex items-center gap-4 p-6">
          <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
            <SpeakerWaveIcon className="w-6 h-6 text-brand-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-brand-text-primary mb-2">Listen to today's module</h3>
            <audio controls className="w-full h-10" src={module.audioUrl} />
          </div>
        </Card>
      )}

      <Card className="border-brand-border bg-brand-dark/30 mb-12">
        <div className="prose prose-invert max-w-none prose-p:text-brand-text-secondary prose-headings:text-brand-text-primary">
          <Markdown>{module.content}</Markdown>
        </div>
      </Card>

      <div className="flex justify-center">
        <button
          onClick={handleMarkComplete}
          disabled={isCompleted || completing}
          className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all ${
            isCompleted 
              ? 'bg-green-900/30 text-green-400 border border-green-500/30 cursor-default' 
              : 'bg-brand-accent text-white hover:bg-opacity-90 hover:scale-105 shadow-lg shadow-brand-accent/20'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckIcon className="w-6 h-6" />
              Module Completed
            </>
          ) : completing ? (
            'Saving...'
          ) : (
            <>
              <CheckIcon className="w-6 h-6" />
              Mark as Complete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChallengeModuleViewerPage;
