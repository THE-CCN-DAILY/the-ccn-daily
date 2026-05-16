import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import { ChevronLeftIcon, CloseIcon } from '../components/icons';
import {
  deleteChallengeModule,
  getChallengeDetail,
  listChallengeModules,
  saveChallengeModule,
  type ChallengeModule,
} from '../services/challengeService';

const ChallengeModuleManagerPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  
  const [challengeTitle, setChallengeTitle] = useState('Loading...');
  const [modules, setModules] = useState<ChallengeModule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [mediaType, setMediaType] = useState<'none' | 'video' | 'audio'>('none');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      fetchModules();
    }
  }, [challengeId]);

  const fetchChallengeDetails = async () => {
    try {
      const data = await getChallengeDetail(challengeId!);
      setChallengeTitle(data.challenge.title);
    } catch (error) {
      console.error('Error fetching challenge:', error);
      setChallengeTitle('Challenge Not Found');
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const fetchedModules = await listChallengeModules(challengeId!);
      setModules(fetchedModules);
      
      // Auto-increment day number for next module
      if (fetchedModules.length > 0) {
        setDayNumber(fetchedModules[fetchedModules.length - 1].dayNumber + 1);
      }
    } catch (error) {
      console.error('Failed to fetch challenge modules', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    
    setIsSaving(true);

    try {
      await saveChallengeModule(challengeId, {
        title,
        description,
        content,
        dayNumber: Number(dayNumber),
        videoUrl: mediaType === 'video' ? mediaUrl.trim() : undefined,
        audioUrl: mediaType === 'audio' ? mediaUrl.trim() : undefined,
      });

      notify('Module added successfully!', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setContent('');
      setMediaUrl('');
      setMediaType('none');
      
      // Refresh list
      fetchModules();
      
    } catch (error) {
      console.error('Failed to save challenge module', error);
      notify('Failed to add module.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (module: ChallengeModule) => {
    if (!window.confirm(`Are you sure you want to delete "Day ${module.dayNumber}: ${module.title}"?`)) return;

    try {
      await deleteChallengeModule(challengeId!, module.id);
      notify('Module deleted successfully!', 'success');
      fetchModules();
    } catch (error) {
      console.error('Failed to delete challenge module', error);
      notify('Failed to delete module.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/studio/content-manager')}
          className="p-2 bg-brand-dark border border-brand-border rounded-full text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary mb-1">Manage Modules</h1>
          <p className="text-brand-text-secondary">Challenge: {challengeTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Add New Module
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">Day #</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  />
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder="e.g. The Power of Focus"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">Short Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  placeholder="Brief summary of the day..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">Main Content</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent resize-none"
                  placeholder="The reading material or instructions for today..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">Media Type (Optional)</label>
                <div className="flex gap-4">
                  {['none', 'video', 'audio'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaType"
                        value={type}
                        checked={mediaType === type}
                        onChange={(e) => setMediaType(e.target.value as any)}
                        className="text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="text-brand-text-secondary capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {mediaType !== 'none' && (
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">{mediaType === 'video' ? 'Video' : 'Audio'} URL</label>
                  <input
                    type="url"
                    required
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder={mediaType === 'video' ? 'https://stream.example.com/module.mp4' : 'https://cdn.example.com/module.mp3'}
                  />
                  <p className="text-xs text-brand-text-secondary mt-2">
                    Direct uploads will move to Cloudflare R2 in the media-storage slice. For now, paste a hosted media URL.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  isSaving ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-brand-accent text-white hover:bg-opacity-90'
                }`}
              >
                {isSaving ? 'Saving...' : 'Add Module'}
              </button>
            </form>
          </Card>
        </div>

        {/* List View */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/30 h-full min-h-[600px]">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
              <span>Modules</span>
              <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
                {modules.length} modules
              </span>
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
              </div>
            ) : modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-brand-secondary flex-shrink-0 flex items-center justify-center font-black text-brand-text-primary">
                        {module.dayNumber}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-brand-text-primary font-bold truncate">{module.title}</h4>
                        <p className="text-xs text-brand-text-secondary truncate">
                          {module.description}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {module.videoUrl && <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full">Video</span>}
                          {module.audioUrl && <span className="text-[10px] bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full">Audio</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button 
                        onClick={() => handleDelete(module)}
                        className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <CloseIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-brand-text-secondary">
                <p>No modules found for this challenge.</p>
                <p className="text-sm mt-2">Use the form to add Day 1.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModuleManagerPage;
