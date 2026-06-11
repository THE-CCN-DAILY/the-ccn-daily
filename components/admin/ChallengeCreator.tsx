
import React, { useState } from 'react';
import Card from '../Card';
import { Wand2 } from 'lucide-react';
import { ReaderIcon, SoundWaveIcon, SpinnerIcon } from '../icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { generateCloudflareText, extractJson } from '../../services/geminiService';
import { publishChallenge } from '../../services/challengeService';

type SourceType = 'Newsletter' | 'Book' | 'Manual' | 'URL';

const ChallengeCreator: React.FC = () => {
    const { notify } = useNotifications();
    const [sourceType, setSourceType] = useState<SourceType>('Newsletter');
    const [sourceValue, setSourceValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [generatedChallenge, setGeneratedChallenge] = useState<any>(null);

    // Scheduling: open challenges are joinable anytime; scheduled ones run in a
    // window and appear on the member radar before they begin.
    const [challengeType, setChallengeType] = useState<'open' | 'scheduled'>('open');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [liveUrl, setLiveUrl] = useState('');

    const handleGenerate = async () => {
        if (!sourceValue.trim()) return;
        setIsGenerating(true);
        try {
            const prompt = `You are an expert curriculum designer for a spiritual community. 
            Transform the following ${sourceType} content into a structured 40-day interactive challenge or course.
            
            Source Content: ${sourceValue}
            
            Return a JSON object with the following structure:
            {
                "title": "A catchy, inspiring title",
                "description": "A compelling 2-sentence description",
                "duration": "40 Days",
                "tasks": ["Task 1", "Task 2", "Task 3"],
                "curriculum": [
                    { "day": 1, "title": "Day 1 Title", "content": "Detailed content for day 1", "task": "Specific task for day 1" }
                ]
            }
            Only return the JSON object.`;

            const responseText = await generateCloudflareText({
                feature: 'challengeCreator',
                model: '@cf/meta/llama-3.1-8b-instruct',
                prompt,
                systemInstruction: 'Return only a valid JSON object for a spiritual formation challenge.',
            });

            const result = extractJson<Record<string, unknown>>(responseText);
            setGeneratedChallenge(result);
        } catch {
            notify('Failed to prepare course. Please try again.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!generatedChallenge) return;
        setIsPublishing(true);
        try {
            await publishChallenge({
                ...generatedChallenge,
                sourceType,
                status: 'published',
                participantsCount: 0,
                challengeType,
                startDate: challengeType === 'scheduled' && startDate
                    ? new Date(startDate).toISOString()
                    : new Date().toISOString(),
                endDate: challengeType === 'scheduled' && endDate ? new Date(endDate).toISOString() : undefined,
                liveUrl: liveUrl.trim() || undefined,
            });
            notify('Challenge published successfully to the community!', 'success');
            setGeneratedChallenge(null);
            setSourceValue('');
        } catch {
            notify('Failed to publish challenge.', 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-accent/20 rounded-lg">
                        <Wand2 className="w-6 h-6 text-brand-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-text-primary">Course & Challenge Studio</h2>
                        <p className="text-sm text-brand-text-secondary">Transform newsletters or books into interactive courses and guided challenges.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">Select Source Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(['Newsletter', 'Book', 'URL', 'Manual'] as SourceType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSourceType(type)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${sourceType === type ? 'bg-brand-accent text-white border-brand-accent shadow-lg' : 'bg-brand-secondary text-brand-text-secondary border-brand-border hover:border-brand-accent/50'}`}
                                >
                                    {type === 'Newsletter' && <SoundWaveIcon className="w-5 h-5" />}
                                    {type === 'Book' && <ReaderIcon className="w-5 h-5" />}
                                    {type === 'URL' && <Wand2 className="w-5 h-5" />}
                                    {type === 'Manual' && <Wand2 className="w-5 h-5" />}
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-2">
                            {sourceType === 'URL' ? 'Enter URL' : sourceType === 'Book' ? 'Select Book from Library' : 'Enter Content / Context'}
                        </label>
                        <textarea
                            value={sourceValue}
                            onChange={(e) => setSourceValue(e.target.value)}
                            placeholder={sourceType === 'URL' ? 'https://theccndaily.substack.com/p/...' : 'Enter the text or context for the course/challenge...'}
                            className="w-full bg-brand-dark border border-brand-border rounded-xl p-4 text-brand-text-primary focus:border-brand-accent outline-none min-h-[120px]"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !sourceValue}
                        className="w-full py-4 bg-brand-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                    >
                        {isGenerating ? (
                            <><SpinnerIcon className="w-5 h-5" /> Preparing Interactive Curriculum...</>
                        ) : (
                            <><Wand2 className="w-5 h-5" /> Prepare Course/Challenge</>
                        )}
                    </button>
                </div>
            </Card>

            {generatedChallenge && (
                <Card className="border-2 border-brand-accent/30 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[12px] font-black bg-brand-accent/10 text-brand-accent px-2 py-1 rounded uppercase tracking-widest">Draft Prepared</span>
                            <h3 className="text-2xl font-bold text-brand-text-primary mt-2">{generatedChallenge.title}</h3>
                            <p className="text-brand-text-secondary">{generatedChallenge.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-brand-accent">{generatedChallenge.duration}</p>
                            <p className="text-[12px] font-bold text-brand-text-secondary uppercase">Duration</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <p className="text-xs font-bold text-brand-text-secondary uppercase">Curriculum Preview</p>
                        {generatedChallenge.tasks?.map((task: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-brand-secondary rounded-lg border border-brand-border">
                                <div className="w-6 h-6 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-[12px] font-bold text-brand-accent">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-brand-text-primary">{task}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-8 p-4 rounded-xl border border-brand-border bg-brand-secondary/40 space-y-4">
                        <p className="text-xs font-bold text-brand-text-secondary uppercase">Availability</p>
                        <div className="grid grid-cols-2 gap-3">
                            {(['open', 'scheduled'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setChallengeType(type)}
                                    className={`px-4 py-3 rounded-lg border text-sm font-bold transition-all ${challengeType === type ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-dark text-brand-text-secondary border-brand-border hover:border-brand-accent/50'}`}
                                >
                                    {type === 'open' ? 'Open · join anytime' : 'Scheduled · timed window'}
                                </button>
                            ))}
                        </div>
                        {challengeType === 'scheduled' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-text-secondary uppercase mb-1">Starts</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:border-brand-accent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-text-secondary uppercase mb-1">Ends</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:border-brand-accent outline-none" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[11px] font-bold text-brand-text-secondary uppercase mb-1">Live session link (optional)</label>
                            <input type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://… (Cloudflare Stream, Zoom, etc.)" className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary focus:border-brand-accent outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setGeneratedChallenge(null)}
                            className="flex-1 py-3 bg-brand-secondary text-brand-text-primary rounded-xl font-bold border border-brand-border hover:bg-brand-border transition-colors"
                        >
                            Discard Draft
                        </button>
                        <button 
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="flex-1 py-3 bg-brand-accent text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                        >
                            {isPublishing ? <><SpinnerIcon className="w-5 h-5" /> Publishing...</> : 'Publish to Community'}
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ChallengeCreator;
