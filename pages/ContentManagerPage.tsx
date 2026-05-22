import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useNotifications } from '../contexts/NotificationContext';
import {
  CatalogContentItem,
  ContentType,
  deleteCatalogContent,
  listCatalogContent,
  saveCatalogContent,
  uploadCatalogMedia,
} from '../services/contentService';
import { CloseIcon, GamificationIcon, ReaderIcon, SparklesIcon, SpeakerWaveIcon } from '../components/icons';

type UploadRole = 'file' | 'cover' | 'audio';

const TABS: Array<{ id: ContentType; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = [
  { id: 'devotionals', label: 'Daily Devotionals', icon: SparklesIcon },
  { id: 'audiobooks', label: 'Audiobooks', icon: SpeakerWaveIcon },
  { id: 'books', label: 'Books (EPUB/PDF)', icon: ReaderIcon },
  { id: 'challenges', label: 'Challenges', icon: GamificationIcon },
  { id: 'courses', label: 'Courses', icon: SparklesIcon },
];

const singular = (type: ContentType) => type === 'audiobooks' ? 'audiobook' : type.slice(0, -1);

const ContentManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('devotionals');
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState<number | ''>('');

  const [items, setItems] = useState<CatalogContentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const requiresAuthor = activeTab === 'audiobooks' || activeTab === 'books' || activeTab === 'courses';
  const usesDate = activeTab === 'devotionals' || activeTab === 'challenges';
  const usesCover = activeTab === 'audiobooks' || activeTab === 'books' || activeTab === 'challenges' || activeTab === 'courses';
  const usesPrimaryFile = activeTab !== 'challenges' && activeTab !== 'courses';
  const primaryFileRole: UploadRole = activeTab === 'books' ? 'file' : 'audio';

  const heading = useMemo(() => singular(activeTab), [activeTab]);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setDate('');
    setFile(null);
    setCoverImage(null);
    setFileUrl('');
    setCoverUrl('');
    setIsPremium(false);
    setPrice('');
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      setItems(await listCatalogContent(activeTab));
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to load ${activeTab}.`, 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    resetForm();
    fetchItems();
  }, [activeTab]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    setter(e.target.files?.[0] || null);
  };

  const uploadIfNeeded = async (selectedFile: File | null, role: UploadRole, existingUrl: string) => {
    if (existingUrl.trim()) return existingUrl.trim();
    if (!selectedFile) return '';
    return uploadCatalogMedia(activeTab, role, selectedFile, setUploadProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadProgress(0);

    try {
      const uploadedFileUrl = usesPrimaryFile
        ? await uploadIfNeeded(file, primaryFileRole, fileUrl)
        : '';
      const uploadedCoverUrl = usesCover
        ? await uploadIfNeeded(coverImage, 'cover', coverUrl)
        : '';

      await saveCatalogContent(activeTab, {
        title,
        description,
        content: activeTab === 'devotionals' ? description : undefined,
        author: activeTab === 'courses' ? undefined : author,
        instructor: activeTab === 'courses' ? author : undefined,
        date: activeTab === 'devotionals' ? date : undefined,
        startDate: activeTab === 'challenges' ? date : undefined,
        audioUrl: activeTab === 'devotionals' || activeTab === 'audiobooks' ? uploadedFileUrl : undefined,
        fileUrl: activeTab === 'books' ? uploadedFileUrl : undefined,
        coverUrl: uploadedCoverUrl || undefined,
        status: 'published',
        isPremium,
        price: isPremium ? Number(price || 0) : 0,
      });

      notify(`${heading} saved successfully.`, 'success');
      resetForm();
      await fetchItems();
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to save ${heading}.`, 'error');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: CatalogContentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteCatalogContent(activeTab, item.id);
      notify(`${heading} deleted successfully.`, 'success');
      await fetchItems();
    } catch (error) {
      notify(error instanceof Error ? error.message : `Failed to delete ${heading}.`, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Content Manager</h1>
        <p className="text-brand-text-secondary">Upload and manage devotionals, audiobooks, books, challenges, and courses.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        <div className="lg:col-span-1">
          <Card className="border-brand-border bg-brand-dark/30 sticky top-24">
            <h2 className="text-xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
              Add New {heading}
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
                  placeholder={`Enter ${heading} title...`}
                />
              </div>

              {requiresAuthor && (
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

              {usesDate && (
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

              {usesCover && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-brand-text-primary">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setCoverImage)}
                    className="w-full text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
                  />
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder="https://.../cover.jpg"
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
                    Premium Content
                  </label>
                </div>

                {isPremium && (
                  <div>
                    <label className="block text-sm font-bold text-brand-text-primary mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {usesPrimaryFile && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-brand-text-primary">
                    {activeTab === 'devotionals' ? 'Audio File' : activeTab === 'audiobooks' ? 'Audio File' : 'Book File'}
                  </label>
                  <input
                    type="file"
                    required={activeTab !== 'devotionals' && !fileUrl}
                    accept={activeTab === 'books' ? '.epub,.pdf' : 'audio/*'}
                    onChange={(e) => handleFileChange(e, setFile)}
                    className="w-full text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-accent/10 file:text-brand-accent hover:file:bg-brand-accent/20"
                  />
                  <input
                    type="url"
                    required={activeTab !== 'devotionals' && !file}
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-brand-text-primary focus:outline-none focus:border-brand-accent"
                    placeholder={activeTab === 'books' ? 'https://.../book.pdf' : 'https://.../audio.mp3'}
                  />
                </div>
              )}

              {isSaving && uploadProgress > 0 && (
                <div className="w-full bg-brand-dark rounded-full h-2.5 mb-4 overflow-hidden">
                  <div className="bg-brand-accent h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  isSaving ? 'bg-brand-secondary text-brand-text-secondary cursor-wait' : 'bg-brand-accent text-white hover:bg-opacity-90'
                }`}
              >
                {isSaving ? 'Saving...' : `Save ${heading}`}
              </button>
            </form>
          </Card>
        </div>

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent" />
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
                            <span className="px-2 py-0.5 text-[12px] font-bold bg-brand-accent/20 text-brand-accent rounded-full whitespace-nowrap">
                              Premium {item.price ? `($${item.price})` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-secondary truncate">
                          {(item.author || item.instructor) && `By ${item.author || item.instructor} - `}
                          {item.date || item.startDate || item.createdAt || 'undated'}
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
                <p className="text-sm mt-2">Use the form to add the first one.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContentManagerPage;
