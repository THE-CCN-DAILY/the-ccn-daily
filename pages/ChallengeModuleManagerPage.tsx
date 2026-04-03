import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNotifications } from '../contexts/NotificationContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { ChevronLeftIcon, CloseIcon } from '../components/icons';

interface ChallengeModule {
  id: string;
  title: string;
  description: string;
  content: string;
  dayNumber: number;
  videoUrl?: string;
  audioUrl?: string;
  createdAt: any;
}

const ChallengeModuleManagerPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  
  const [challengeTitle, setChallengeTitle] = useState('Loading...');
  const [modules, setModules] = useState<ChallengeModule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'none' | 'video' | 'audio'>('none');

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      fetchModules();
    }
  }, [challengeId]);

  const fetchChallengeDetails = async () => {
    try {
      const docRef = doc(db, 'challenges', challengeId!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setChallengeTitle(docSnap.data().title);
      } else {
        setChallengeTitle('Challenge Not Found');
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, `challenges/${challengeId}/modules`), orderBy('dayNumber', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedModules: ChallengeModule[] = [];
      querySnapshot.forEach((doc) => {
        fetchedModules.push({ id: doc.id, ...doc.data() } as ChallengeModule);
      });
      setModules(fetchedModules);
      
      // Auto-increment day number for next module
      if (fetchedModules.length > 0) {
        setDayNumber(fetchedModules[fetchedModules.length - 1].dayNumber + 1);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `challenges/${challengeId}/modules`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const uploadFile = async (fileToUpload: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `${path}/${Date.now()}_${fileToUpload.name}`);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let uploadedMediaUrl = '';

      if (mediaFile && mediaType !== 'none') {
        uploadedMediaUrl = await uploadFile(mediaFile, `content/challenges/${challengeId}/modules`);
      }

      const moduleData: any = {
        title,
        description,
        content,
        dayNumber: Number(dayNumber),
        createdAt: serverTimestamp(),
      };

      if (mediaType === 'video') moduleData.videoUrl = uploadedMediaUrl;
      if (mediaType === 'audio') moduleData.audioUrl = uploadedMediaUrl;

      await addDoc(collection(db, `challenges/${challengeId}/modules`), moduleData);

      notify('Module added successfully!', 'success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setContent('');
      setMediaFile(null);
      setMediaType('none');
      
      // Refresh list
      fetchModules();
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `challenges/${challengeId}/modules`);
      notify('Failed to add module.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (module: ChallengeModule) => {
    if (!window.confirm(`Are you sure you want to delete "Day ${module.dayNumber}: ${module.title}"?`)) return;

    try {
      await deleteDoc(doc(db, `challenges/${challengeId}/modules`, module.id));
      notify('Module deleted successfully!', 'success');
      fetchModules();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `challenges/${challengeId}/modules/${module.id}`);
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
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">Upload {mediaType === 'video' ? 'Video' : 'Audio'}</label>
                  <input
                    type="file"
                    required
                    accept={mediaType === 'video' ? 'video/*' : 'audio/*'}
                    onChange={handleFileChange}
                    className="w-full text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
                  />
                </div>
              )}

              {isUploading && (
                <div className="w-full bg-brand-dark rounded-full h-2.5 mb-4 overflow-hidden">
                  <div className="bg-brand-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  isUploading ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-brand-accent text-white hover:bg-opacity-90'
                }`}
              >
                {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Add Module'}
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
