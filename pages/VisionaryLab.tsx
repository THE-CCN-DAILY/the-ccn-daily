
import React, { useState } from 'react';
import Card from '../components/Card';
import { FlaskConical } from 'lucide-react';
import { AiIcon, SpinnerIcon, SearchIcon, SoundWaveIcon, CheckIcon, MicrophoneIcon } from '../components/icons';
import { getGroundedPrayerTopics, getDeepTheologicalInsight, generateSanctuaryVideo } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const VisionaryLab: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [isGrounding, setIsGrounding] = useState(false);
  const [groundedTopics, setGroundedTopics] = useState<any[]>([]);
  const [deepQuestion, setDeepQuestion] = useState('');
  const [deepInsight, setDeepInsight] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Cinematic Video State
  const [videoPrompt, setVideoPrompt] = useState('A drone shot of a peaceful lighthouse on a rugged cliff at dawn with crashing waves');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const handleTestGrounding = async () => {
    if (!user) return;
    setIsGrounding(true);
    try {
      const topics = await getGroundedPrayerTopics(user.role as any, user.uid);
      setGroundedTopics(topics);
    } catch (e) {
      notify("Grounding test failed.", "error");
    } finally {
      setIsGrounding(false);
    }
  };

  const handleDeepStudy = async () => {
    if (!deepQuestion.trim() || !user) return;
    setIsThinking(true);
    setDeepInsight('');
    try {
      const result = await getDeepTheologicalInsight(deepQuestion, user.role as any, user.uid);
      setDeepInsight(result);
    } catch (e) {
      notify("Thinking test failed.", "error");
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!user) return;
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return; // Proceed assuming user will re-trigger
    }

    setIsVideoLoading(true);
    setVideoUrl(null);
    try {
        const url = await generateSanctuaryVideo(videoPrompt, (msg) => setVideoStatus(msg), user.role as any);
        setVideoUrl(url);
    } catch (e: any) {
        if (e.message?.includes("Requested entity was not found")) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        } else {
            notify("Video generation error. Check console.", "error");
        }
    } finally {
        setIsVideoLoading(false);
        setVideoStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Visionary Tech Lab</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        Prototyping Phase 5 & 6: Grounding, Deep Reasoning, and Cinematic Motion.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Grounded Intercession Demo */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
            <SearchIcon className="w-6 h-6 mr-2 text-brand-accent"/>
            Grounded Intercession
          </h2>
          <p className="text-sm text-brand-text-secondary mb-6">
            Real-time global humanitarian insights for communal prayer.
          </p>
          <button 
            onClick={handleTestGrounding}
            disabled={isGrounding}
            className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 mb-6"
          >
            {isGrounding ? <SpinnerIcon className="w-5 h-5"/> : 'Sync Global Prayer Needs'}
          </button>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
            {groundedTopics.map((topic, i) => (
              <div key={i} className="p-3 bg-brand-secondary/50 rounded-lg border border-brand-border animate-fade-in-up">
                <p className="text-sm font-bold text-brand-text-primary">{topic.title}</p>
                <p className="text-xs text-brand-text-secondary mt-1 line-clamp-2">{topic.snippet}</p>
                <a href={topic.uri} target="_blank" rel="noreferrer" className="text-[12px] text-brand-accent underline block mt-2">Source Link</a>
              </div>
            ))}
          </div>
        </Card>

        {/* Cinematic Video Demo (PHASE 6) */}
        <Card className="flex flex-col border-brand-accent/30 bg-brand-accent/5">
            <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
                <FlaskConical className="w-6 h-6 mr-2 text-brand-accent animate-pulse"/>
                Cinematic Sanctuary
            </h2>
            <p className="text-xs text-brand-text-secondary mb-4 uppercase tracking-widest font-black">Phase 6 Immersion</p>
            <textarea 
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full h-24 p-3 bg-brand-dark border border-brand-border rounded-lg text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent mb-4"
                placeholder="Describe your meditation cinematic..."
            />
            <button 
                onClick={handleGenerateVideo}
                disabled={isVideoLoading}
                className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50"
            >
                {isVideoLoading ? <SpinnerIcon className="w-5 h-5"/> : 'Generate Cinematic Motion'}
            </button>

            <div className="mt-4 flex-1 bg-brand-dark rounded-lg border border-brand-border overflow-hidden min-h-[200px] flex items-center justify-center relative">
                {isVideoLoading && (
                    <div className="text-center p-4">
                        <div className="w-12 h-12 border-t-2 border-brand-accent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs text-brand-accent font-bold animate-pulse uppercase tracking-widest">{videoStatus}</p>
                    </div>
                )}
                {videoUrl && (
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                )}
                {!videoUrl && !isVideoLoading && (
                    <p className="text-[12px] text-brand-text-secondary italic">Enter prompt to architect motion sanctuary.</p>
                )}
            </div>
        </Card>
      </div>

      {/* Deep Thinking Demo */}
      <Card>
        <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
        <AiIcon className="w-6 h-6 mr-2 text-brand-accent"/>
        Theological Deep Study
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
                <textarea 
                    value={deepQuestion}
                    onChange={(e) => setDeepQuestion(e.target.value)}
                    className="w-full h-32 p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none mb-4"
                    placeholder="Ask a deep theological question..."
                />
                <button 
                    onClick={handleDeepStudy}
                    disabled={isThinking || !deepQuestion.trim()}
                    className="w-full py-3 rounded-lg bg-secondary-purple text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isThinking ? <SpinnerIcon className="w-5 h-5"/> : 'Engage Scholarly Reasoning'}
                </button>
            </div>
            <div className="flex-1 bg-brand-secondary/30 rounded-xl p-6 min-h-[200px] flex flex-col">
                {isThinking && <p className="text-sm text-brand-text-secondary animate-pulse italic">Sentinel reasoning engine processing multiple scriptural layers...</p>}
                {deepInsight && <p className="text-sm text-brand-text-primary whitespace-pre-wrap leading-relaxed">{deepInsight}</p>}
                {!deepInsight && !isThinking && <p className="text-sm text-brand-text-secondary opacity-50 italic">Reasoning output will appear here.</p>}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default VisionaryLab;
