import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNotifications } from '../contexts/NotificationContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { SparklesIcon, CheckIcon, SpeakerWaveIcon, ReaderIcon, GamificationIcon, CloseIcon } from '../components/icons';

type ContentTab = 'devotionals' | 'audiobooks' | 'books' | 'challenges' | 'courses';

interface ContentItem {
  id: string;
  title: string;
  author?: string;
  date?: string;
  startDate?: string;
  createdAt: any;
  fileUrl?: string;
  coverUrl?: string;
  audioUrl?: string;
  isPremium?: boolean;
  price?: number;
}

const ContentManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>('devotionals');
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form States
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState<number | ''>('');

  // List States
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const q = query(collection(db, activeTab), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedItems: ContentItem[] = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as ContentItem);
      });
      setItems(fetchedItems);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, activeTab);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
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
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = '';
      let coverUrl = '';

      if (file) {
        fileUrl = await uploadFile(file, `content/${activeTab}/files`);
      }
      if (coverImage) {
        coverUrl = await uploadFile(coverImage, `content/${activeTab}/covers`);
      }

      const baseData = {
        title,
        description,
        createdAt: serverTimestamp(),
        status: 'published',
        authorUid: auth.currentUser?.uid,
        isPremium,
        price: isPremium ? Number(price) : 0,
      };

      if (activeTab === 'devotionals') {
        await addDoc(collection(db, 'devotionals'), {
          ...baseData,
          date,
          audioUrl: fileUrl,
          content: description, // using description as content for simplicity in UI
        });
      } else if (activeTab === 'audiobooks') {
        await addDoc(collection(db, 'audiobooks'), {
          ...baseData,
          author,
          audioUrl: fileUrl,
          coverUrl,
        });
      } else if (activeTab === 'books') {
        await addDoc(collection(db, 'books'), {
          ...baseData,
          author,
          fileUrl, // EPUB or PDF
          coverUrl,
        });
      } else if (activeTab === 'challenges') {
        await addDoc(collection(db, 'challenges'), {
          ...baseData,
          startDate: date,
          coverUrl,
          participantsCount: 0,
        });
      } else if (activeTab === 'courses') {
        await addDoc(collection(db, 'courses'), {
          ...baseData,
          instructor: author,
          coverUrl,
          moduleCount: 0,
        });
      }

      notify(`${activeTab.slice(0, -1)} uploaded successfully!`, 'success');
      
      // Reset form
      setTitle('');
      setAuthor('');
      setDescription('');
      setDate('');
      setFile(null);
      setCoverImage(null);
      setIsPremium(false);
      setPrice('');
      
      // Refresh list
      fetchItems();
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, activeTab);
      notify(`Failed to upload ${activeTab.slice(0, -1)}.`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      // Delete document
      await deleteDoc(doc(db, activeTab, item.id));

      // Note: In a production app, you would also delete the files from Storage here
      // using deleteObject(ref(storage, item.fileUrl)) if they exist.
      // For this prototype, we'll just delete the Firestore document to avoid complex URL parsing.

      notify(`${activeTab.slice(0, -1)} deleted successfully!`, 'success');
      fetchItems();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${activeTab}/${item.id}`);
      notify(`Failed to delete ${activeTab.slice(0, -1)}.`, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Content Manager</h1>
        <p className="text-brand-text-secondary">Upload and manage devotionals, audiobooks, books, and challenges.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'devotionals', label: 'Daily Devotionals', icon: SparklesIcon },
          { id: 'audiobooks', label: 'Audiobooks', icon: SpeakerWaveIcon },
          { id: 'books', label: 'Books (EPUB/PDF)', icon: ReaderIcon },
          { id: 'challenges', label: 'Challenges', icon: GamificationIcon },
          { id: 'courses', label: 'Courses', icon: SparklesIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ContentTab)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-accent text-white'
                : 'bg-brand-dark border border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Add New {activeTab.slice(0, -1)}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  placeholder={`Enter ${activeTab.slice(0, -1)} title...`}
                />
              </div>

              {(activeTab === 'audiobooks' || activeTab === 'books' || activeTab === 'courses') && (
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">
                    {activeTab === 'courses' ? 'Instructor' : 'Author'}
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder={activeTab === 'courses' ? 'Instructor name...' : 'Author name...'}
                  />
                </div>
              )}

              {(activeTab === 'devotionals' || activeTab === 'challenges') && (
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">
                    {activeTab === 'devotionals' ? 'Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-text-primary mb-2">
                  {activeTab === 'devotionals' ? 'Devotional Content' : 'Description'}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent resize-none"
                  placeholder={`Enter ${activeTab === 'devotionals' ? 'content' : 'description'}...`}
                />
              </div>

              {(activeTab === 'audiobooks' || activeTab === 'books' || activeTab === 'challenges' || activeTab === 'courses') && (
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setCoverImage)}
                    className="w-full text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 border border-brand-border rounded-xl p-4 bg-brand-dark/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="w-5 h-5 rounded border-brand-border bg-brand-dark text-brand-accent focus:ring-brand-accent focus:ring-offset-brand-dark"
                  />
                  <label htmlFor="isPremium" className="text-sm font-bold text-brand-text-primary">
                    Premium Content (Requires Subscription or Purchase)
                  </label>
                </div>
                
                {isPremium && (
                  <div>
                    <label className="block text-sm font-bold text-brand-text-primary mb-2">
                      Price ($) - Optional
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                      placeholder="Leave at 0 if included in subscription only"
                    />
                  </div>
                )}
              </div>

              {(activeTab !== 'challenges' && activeTab !== 'courses') && (
                <div>
                  <label className="block text-sm font-bold text-brand-text-primary mb-2">
                    {activeTab === 'devotionals' ? 'Audio File (Optional)' : activeTab === 'audiobooks' ? 'Audio File' : 'Book File (EPUB/PDF)'}
                  </label>
                  <input
                    type="file"
                    required={activeTab !== 'devotionals'}
                    accept={activeTab === 'books' ? '.epub,.pdf' : 'audio/*'}
                    onChange={(e) => handleFileChange(e, setFile)}
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
                {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : `Upload ${activeTab.slice(0, -1)}`}
              </button>
            </form>
          </Card>
        </div>

        {/* List View */}
        <div className="lg:col-span-2">
          <Card className="border-brand-border bg-brand-dark/30 h-full min-h-[600px]">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4 flex justify-between items-center">
              <span>Manage {activeTab}</span>
              <span className="text-sm font-normal text-brand-text-secondary bg-brand-secondary px-3 py-1 rounded-full">
                {items.length} items
              </span>
            </h2>
            
            {loadingItems ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-dark/50 hover:border-brand-accent/50 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      {(item.coverUrl || activeTab === 'devotionals') && (
                        <div className="w-12 h-12 rounded bg-brand-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <SparklesIcon className="w-6 h-6 text-brand-text-secondary/50" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-brand-text-primary font-bold truncate">{item.title}</h4>
                          {item.isPremium && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-accent/20 text-brand-accent rounded-full whitespace-nowrap">
                              Premium {item.price ? `($${item.price})` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-secondary truncate">
                          {item.author && `By ${item.author} • `}
                          {item.date || item.startDate || new Date(item.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {(activeTab === 'challenges' || activeTab === 'courses') && (
                        <button
                          onClick={() => navigate(`/studio/${activeTab}/${item.id}/modules`)}
                          className="px-3 py-1.5 text-xs font-bold bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg transition-colors"
                        >
                          Manage Modules
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item)}
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
                <p>No {activeTab} found.</p>
                <p className="text-sm mt-2">Use the form to upload your first one.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContentManagerPage;
