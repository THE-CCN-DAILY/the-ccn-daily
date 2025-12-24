
import React, { useState } from 'react';
import Card from '../components/Card';
import { AiIcon, SparklesIcon, SpinnerIcon, SearchIcon, SoundWaveIcon, CheckIcon } from '../components/icons';
import { getGroundedPrayerTopics, getDeepTheologicalInsight } from '../services/geminiService';

const VisionaryLab: React.FC = () => {
  const [isGrounding, setIsGrounding] = useState(false);
  const [groundedTopics, setGroundedTopics] = useState<any[]>([]);
  const [deepQuestion, setDeepQuestion] = useState('');
  const [deepInsight, setDeepInsight] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleTestGrounding = async () => {
    setIsGrounding(true);
    try {
      const topics = await getGroundedPrayerTopics();
      setGroundedTopics(topics);
    } catch (e) {
      alert("Grounding test failed. This requires a model with search capabilities.");
    } finally {
      setIsGrounding(false);
    }
  };

  const handleDeepStudy = async () => {
    if (!deepQuestion.trim()) return;
    setIsThinking(true);
    setDeepInsight('');
    try {
      const result = await getDeepTheologicalInsight(deepQuestion);
      setDeepInsight(result);
    } catch (e) {
      alert("Thinking test failed.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Visionary Tech Lab</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        Prototyping Phase 5: Grounding, Deep Thinking, and Real-time sentience.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grounded Intercession Demo */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
            <SearchIcon className="w-6 h-6 mr-2 text-brand-accent"/>
            Grounded Intercession
          </h2>
          <p className="text-sm text-brand-text-secondary mb-6">
            Uses <strong>Google Search Grounding</strong> to suggest prayer topics based on real-world events happening <em>right now</em>.
          </p>
          <button 
            onClick={handleTestGrounding}
            disabled={isGrounding}
            className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 mb-6"
          >
            {isGrounding ? <SpinnerIcon className="w-5 h-5"/> : 'Fetch Real-world Prayer Topics'}
          </button>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
            {groundedTopics.map((topic, i) => (
              <div key={i} className="p-3 bg-brand-secondary/50 rounded-lg border border-brand-border animate-fade-in-up">
                <p className="text-sm font-bold text-brand-text-primary">{topic.title}</p>
                <p className="text-xs text-brand-text-secondary mt-1">{topic.snippet}</p>
                <a href={topic.uri} target="_blank" rel="noreferrer" className="text-[10px] text-brand-accent underline block mt-2">Source: {topic.uri}</a>
              </div>
            ))}
            {groundedTopics.length === 0 && !isGrounding && (
              <div className="h-32 border-2 border-dashed border-brand-border rounded-lg flex items-center justify-center text-brand-text-secondary/50 italic">
                No data fetched yet.
              </div>
            )}
          </div>
        </Card>

        {/* Deep Thinking Demo */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
            <AiIcon className="w-6 h-6 mr-2 text-brand-accent"/>
            Theological Deep Study
          </h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Uses <strong>Gemini 3 Pro Thinking</strong> for complex, multi-step spiritual reasoning.
          </p>
          <textarea 
            value={deepQuestion}
            onChange={(e) => setDeepQuestion(e.target.value)}
            className="w-full h-24 p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none mb-4"
            placeholder="Ask a deep theological question..."
          />
          <button 
            onClick={handleDeepStudy}
            disabled={isThinking || !deepQuestion.trim()}
            className="w-full py-3 rounded-lg bg-secondary-purple text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50"
          >
            {isThinking ? <SpinnerIcon className="w-5 h-5"/> : 'Reason Through This'}
          </button>

          {isThinking && (
            <div className="mt-4 p-4 bg-brand-accent/5 rounded-lg border border-brand-accent/20 animate-pulse">
                <p className="text-xs text-brand-accent font-bold uppercase tracking-widest">AI is Thinking...</p>
                <p className="text-sm text-brand-text-secondary mt-1 italic">Analyzing multiple theological perspectives and scriptures...</p>
            </div>
          )}

          {deepInsight && (
            <div className="mt-4 p-4 bg-brand-secondary rounded-lg border border-brand-border animate-fade-in-up flex-1 overflow-y-auto max-h-[250px]">
                <p className="text-sm text-brand-text-primary whitespace-pre-wrap">{deepInsight}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Concept: Gemini Live */}
      <Card className="mt-8 bg-brand-dark border-brand-accent/30">
        <div className="flex flex-col items-center py-8 text-center">
            <div className="w-24 h-24 bg-brand-accent/20 rounded-full flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 bg-brand-accent rounded-full animate-ping opacity-20"></div>
                <SoundWaveIcon className="w-12 h-12 text-brand-accent"/>
            </div>
            <h3 className="text-2xl font-bold text-brand-text-primary mb-2">Gemini Live Prototype</h3>
            <p className="text-brand-text-secondary max-w-xl mb-6">
                Imagine a "Sentient Guide" who speaks with you during your journey. No buttons, just a low-latency voice conversation. 
                Kai can hear your voice cracking during prayer and offer a comfort-focused verse.
            </p>
            <div className="flex gap-4">
                <button className="px-6 py-2 bg-brand-accent text-white rounded-full font-bold opacity-50 cursor-not-allowed">Coming to Production</button>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default VisionaryLab;
