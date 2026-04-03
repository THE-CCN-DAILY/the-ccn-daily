import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db, auth } from '../firebase';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { PaintBrushIcon, SparklesIcon, PlusCircleIcon } from '../components/icons';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';

interface JournalEntry {
  id: string;
  text: string;
  color: string;
  createdAt: any;
}

const JournalingPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const colors = [
    { id: 'blue', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
    { id: 'green', bg: 'bg-green-900/30', border: 'border-green-500/50' },
    { id: 'yellow', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50' },
    { id: 'pink', bg: 'bg-pink-900/30', border: 'border-pink-500/50' },
  ];

  useEffect(() => {
    if (!user) return;

    const fetchEntries = async () => {
      try {
        const q = query(
          collection(db, `users/${user.uid}/notes`),
          where('contentId', '==', 'journal_entry'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedEntries: JournalEntry[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEntries.push({ id: doc.id, ...doc.data() } as JournalEntry);
        });
        setEntries(fetchedEntries);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/notes`);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const handleSaveEntry = async () => {
    if (!newEntryText.trim() || !user) return;

    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/notes`), {
        contentId: 'journal_entry',
        text: newEntryText,
        color: selectedColor,
        createdAt: serverTimestamp(),
      });

      // Optimistic update
      setEntries([
        {
          id: docRef.id,
          text: newEntryText,
          color: selectedColor,
          createdAt: { toDate: () => new Date() },
        },
        ...entries,
      ]);

      setNewEntryText('');
      setIsWriting(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/notes`);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-brand-text-primary mb-2">My Journal</h1>
          <p className="text-xl text-brand-text-secondary">
            Reflect on your spiritual journey and record what God is teaching you.
          </p>
        </div>
        {!isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="flex items-center px-4 py-2 bg-brand-accent text-white rounded-lg font-bold hover:bg-opacity-90 transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            New Entry
          </button>
        )}
      </div>

      {isWriting && (
        <Card className="mb-8 border-brand-accent/50 bg-brand-dark/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-brand-text-primary">New Reflection</h3>
            <div className="flex space-x-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-6 h-6 rounded-full border-2 ${c.bg} ${selectedColor === c.id ? c.border : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            placeholder="What is on your heart today?"
            className="w-full h-40 bg-brand-dark border border-brand-border rounded-lg p-4 text-brand-text-primary focus:outline-none focus:border-brand-accent resize-none mb-4"
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 text-brand-text-secondary font-bold hover:text-brand-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEntry}
              disabled={!newEntryText.trim()}
              className="px-6 py-2 bg-brand-accent text-white rounded-lg font-bold disabled:opacity-50 hover:bg-opacity-90 transition-colors"
            >
              Save Entry
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-6">
          {entries.map((entry) => {
            const colorObj = colors.find(c => c.id === entry.color) || colors[0];
            return (
              <Card key={entry.id} className={`border ${colorObj.border} ${colorObj.bg} p-6`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-brand-text-secondary">
                    {formatDate(entry.createdAt)}
                  </span>
                  <PaintBrushIcon className="w-5 h-5 text-brand-text-secondary/50" />
                </div>
                <p className="text-brand-text-primary whitespace-pre-wrap leading-relaxed">
                  {entry.text}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        !isWriting && (
          <Card className="text-center py-20 border-brand-border border-dashed bg-transparent">
            <PaintBrushIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">No journal entries yet</h3>
            <p className="text-brand-text-secondary mb-6">
              Start documenting your spiritual journey today.
            </p>
            <button
              onClick={() => setIsWriting(true)}
              className="px-6 py-2 bg-brand-secondary text-brand-text-primary rounded-lg font-bold border border-brand-border hover:bg-brand-dark transition-colors"
            >
              Write First Entry
            </button>
          </Card>
        )
      )}
    </div>
  );
};

export default JournalingPage;
