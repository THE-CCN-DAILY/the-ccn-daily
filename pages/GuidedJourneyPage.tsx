
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
// FIX: Added SoundWaveIcon to the imported icons list
import { CheckIcon, FlagIcon, PencilIcon, PrayingHandsIcon, ReaderIcon, SparklesIcon, CloseIcon, ChevronLeftIcon, SoundWaveIcon } from '../components/icons';
import RichTextJournal from '../components/RichTextJournal';
import PrayerTimer from '../components/PrayerTimer';
import { getScriptureSnippet } from '../services/bibleService';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

interface Devotional {
  id: string;
  title: string;
  content: string;
  date: string;
  audioUrl?: string;
}

const journeySteps = [
  { id: 'start', name: 'Start', icon: FlagIcon },
  { id: 'opening-prayer', name: 'Opening Prayer', icon: PrayingHandsIcon },
  { id: 'devotional', name: 'Daily Devotional', icon: ReaderIcon },
  { id: 'journaling', name: 'Journaling', icon: PencilIcon },
  { id: 'guided-prayer', name: 'Guided Prayer', icon: PrayingHandsIcon },
  { id: 'declaration', name: 'Declaration', icon: SparklesIcon },
  { id: 'further-study', name: 'Further Study', icon: ReaderIcon },
  { id: 'finish', name: 'Finish', icon: FlagIcon },
];

const ScriptureSnippetModal: React.FC<{ 
    reference: string; 
    onClose: () => void; 
}> = ({ reference, onClose }) => {
    const navigate = useNavigate();
    const [snippet, setSnippet] = useState<{ref: string, text: string, book: string, chapter: number} | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        getScriptureSnippet(reference).then(res => {
            setSnippet(res);
            setLoading(false);
        });
    }, [reference]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
            <Card className="w-full max-w-lg border-brand-accent/30 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-accent transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                {loading ? (
                    <div className="py-12 text-center text-brand-text-secondary animate-pulse">Summoning Scripture...</div>
                ) : (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold text-brand-accent mb-4">{snippet?.ref}</h3>
                        <div className="prose prose-sm text-brand-text-primary italic mb-8" dangerouslySetInnerHTML={{ __html: snippet?.text || '' }} />
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-brand-secondary border border-brand-border rounded-lg text-sm font-bold text-brand-text-secondary hover:bg-brand-border"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => navigate(`/app/bible?book=${snippet?.book}&chapter=${snippet?.chapter}`)}
                                className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90"
                            >
                                <ReaderIcon className="w-4 h-4"/> Full Study
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

const StepContent: React.FC<{ stepIndex: number; onComplete: () => void; devotional: Devotional | null }> = ({ stepIndex, onComplete, devotional }) => {
    const [isPrayerComplete, setIsPrayerComplete] = useState(false);
    const [activeSnippet, setActiveSnippet] = useState<string | null>(null);
    const isPrayerStep = stepIndex === 4;

    const renderContent = () => {
        switch (stepIndex) {
            case 0:
                return (
                    <div className="text-center py-8">
                        <h2 className="text-3xl font-bold text-brand-text-primary mb-4 text-dynamic-accent">Prepare Your Heart</h2>
                        <p className="text-lg text-brand-text-secondary mb-6">Welcome to a space designed for peace. Today's journey is a 12-minute investment in your spiritual clarity.</p>
                    </div>
                );
            case 1:
                return (
                    <div className="py-4">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-6 flex items-center gap-3">
                            <PrayingHandsIcon className="w-8 h-8 text-brand-accent"/>
                            Opening Prayer
                        </h2>
                        <div className="bg-brand-secondary/40 p-8 rounded-2xl border border-brand-border">
                            <p className="text-xl text-brand-text-primary italic leading-relaxed">
                                "Father, I acknowledge Your presence here with me. As I step away from the noise of the world, I ask that You would tune my heart to Your frequency. Speak through the stillness. Amen."
                            </p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 mx-auto bg-brand-accent/10 rounded-full flex items-center justify-center mb-6">
                            <ReaderIcon className="w-10 h-10 text-brand-accent"/>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Today's Reflection</h2>
                        {devotional ? (
                            <div className="text-left max-w-2xl mx-auto">
                                <h3 className="text-xl font-bold text-brand-accent mb-4 text-center">{devotional.title}</h3>
                                {devotional.audioUrl && (
                                    <div className="mb-6">
                                        <audio controls className="w-full h-10 rounded-full bg-brand-secondary">
                                            <source src={devotional.audioUrl} type="audio/mpeg" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                                <div className="prose prose-sm text-brand-text-secondary mx-auto">
                                    <ReactMarkdown>{devotional.content}</ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <p className="text-brand-text-secondary max-w-md mx-auto">
                                Today's devotional is not available yet. Focus on the core message of <strong>"Unshakeable Peace"</strong>.
                            </p>
                        )}
                    </div>
                );
            case 3:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Journal Your Response</h2>
                        <p className="text-brand-text-secondary mb-6">Where in your life do you need God's strength today? Type it out—the act of writing is an act of release.</p>
                        <RichTextJournal />
                    </div>
                );
            case 4:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-6 flex items-center gap-3">
                            <SoundWaveIcon className="w-8 h-8 text-brand-accent animate-pulse"/>
                            Guided Prayer Sanctuary
                        </h2>
                        <PrayerTimer duration={120} onComplete={() => setIsPrayerComplete(true)} />
                    </div>
                );
            case 5:
                return (
                     <div className="text-center py-10">
                        <p className="text-xs font-bold text-brand-accent uppercase tracking-[0.2em] mb-4">Daily Declaration</p>
                        <h2 className="text-3xl font-black text-brand-text-primary leading-tight px-4 border-l-4 border-brand-accent">
                            "I am not a slave to fear. I am a child of God. His peace, which surpasses understanding, guards my mind and my heart today."
                        </h2>
                    </div>
                );
            case 6:
                return (
                     <div>
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-6">For Further Study</h2>
                        <p className="text-brand-text-secondary mb-6">Click a verse to read it instantly in your sanctuary.</p>
                         <div className="grid gap-3">
                            {['Joshua 1:9', 'Deuteronomy 31:6', '2 Timothy 1:7'].map(ref => (
                                <button 
                                    key={ref}
                                    onClick={() => setActiveSnippet(ref)}
                                    className="p-5 bg-brand-secondary/50 rounded-2xl border border-brand-border flex items-center justify-between group hover:border-brand-accent transition-all"
                                >
                                    <span className="font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">{ref}</span>
                                    <ReaderIcon className="w-5 h-5 text-brand-text-secondary opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all"/>
                                </button>
                            ))}
                        </div>
                        {activeSnippet && <ScriptureSnippetModal reference={activeSnippet} onClose={() => setActiveSnippet(null)} />}
                    </div>
                );
            case 7:
                 return (
                    <div className="text-center py-12">
                        <div className="relative inline-block mb-6">
                            <CheckIcon className="w-20 h-20 text-status-success"/>
                            <div className="absolute inset-0 bg-status-success/20 rounded-full animate-ping"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-brand-text-primary mb-2">Journey Fulfilled</h2>
                        <p className="text-brand-text-secondary">You have set a firm foundation for your day. Go in peace and power.</p>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <Card className="flex flex-col items-center justify-center p-10 min-h-[35rem] animate-fade-in-up transition-all" style={{animationDuration: '0.6s'}}>
            <div className="w-full max-w-xl">
                 {renderContent()}
                 <div className="mt-12 text-center">
                    <button 
                        onClick={onComplete} 
                        disabled={isPrayerStep && !isPrayerComplete}
                        className="group relative px-10 py-4 rounded-full bg-brand-accent text-white font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100"
                    >
                        <span className="flex items-center gap-2">
                             {stepIndex === 0 ? "Step Inside" : stepIndex === journeySteps.length - 1 ? "Carry the Light" : "I've Finished This Step"}
                             <ChevronLeftIcon className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform"/>
                        </span>
                    </button>
                 </div>
            </div>
        </Card>
    )
}

const GuidedJourneyPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [devotional, setDevotional] = useState<Devotional | null>(null);

    useEffect(() => {
        const fetchTodayDevotional = async () => {
            try {
                // Get today's date in YYYY-MM-DD format (local time)
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayString = `${year}-${month}-${day}`;

                const q = query(
                    collection(db, 'devotionals'),
                    where('date', '==', todayString),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setDevotional({ id: doc.id, ...doc.data() } as Devotional);
                }
            } catch (error) {
                console.error("Error fetching today's devotional:", error);
            }
        };

        fetchTodayDevotional();
    }, []);
    
    const handleNextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (currentStep < journeySteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCurrentStep(0);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-10 text-center">
                <h1 className="text-5xl font-black text-brand-text-primary mb-4 tracking-tight">The CCN Journey</h1>
                <div className="h-1 w-24 bg-brand-accent mx-auto rounded-full" />
            </div>

            {/* Premium Stepper */}
            <div className="mb-12 overflow-x-auto py-4">
                <ol className="flex items-center w-full max-w-4xl mx-auto px-4">
                    {journeySteps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;

                        return (
                             <li key={step.id} className={`relative flex w-full items-center ${index < journeySteps.length - 1 ? "after:content-[''] after:w-full after:h-[2px] after:inline-block" : ""} ${isCompleted ? 'after:bg-brand-accent' : 'after:bg-brand-border'}`}>
                                <div className="flex flex-col items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${isCurrent ? 'bg-brand-accent text-white scale-125 shadow-[0_0_20px_rgba(var(--color-primary-blue),0.4)]' : isCompleted ? 'bg-brand-accent text-white opacity-60' : 'bg-brand-secondary text-brand-text-secondary border-2 border-brand-border'}`}>
                                        {isCompleted ? <CheckIcon className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                    </div>
                                    <p className={`absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isCurrent ? 'text-brand-accent opacity-100' : 'text-brand-text-secondary opacity-40'}`}>{step.name}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Content with smoother movement */}
            <div className="mt-20">
                <StepContent key={currentStep} stepIndex={currentStep} onComplete={handleNextStep} devotional={devotional} />
            </div>

        </div>
    );
};

export default GuidedJourneyPage;
