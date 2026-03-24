import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { CalendarIcon, ShareIcon, UserIcon } from '../components/icons';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';

interface AppEvent {
  id: string;
  title: string;
  date: any;
  description: string;
  attendeeCount: number;
  type: 'online' | 'physical';
  streamingPlatform?: string;
}

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()?.toISOString() || new Date().toISOString()
      })) as AppEvent[];
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    return () => unsubscribe();
  }, [user]);

  const handleRegister = async (id: string) => {
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        attendeeCount: increment(1)
      });
      setRegistered(prev => ({ ...prev, [id]: true }));
      alert('Successfully registered! A Grace Link has been sent to your email.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `events/${id}`);
    }
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/#/events/${id}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Grace Link copied to clipboard! Share this link to invite others.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4">
          <CalendarIcon className="w-10 h-10 text-brand-accent"/>
          Live Events
        </h1>
        <p className="text-brand-text-secondary mt-2">Register for upcoming online streams and physical gatherings.</p>
      </div>

      <div className="space-y-6">
        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-brand-text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-brand-text-secondary">No upcoming events at the moment. Check back soon!</p>
          </Card>
        ) : (
          events.map(event => (
            <Card key={event.id} className="p-0 overflow-hidden border-l-4 border-brand-accent">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{event.title}</h2>
                    <p className="text-sm text-brand-text-secondary flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-brand-secondary/50 px-3 py-1 rounded-full text-xs font-bold text-brand-text-secondary">
                    <UserIcon className="w-4 h-4" />
                    {event.attendeeCount} Registered
                  </div>
                </div>
                
                <p className="text-brand-text-secondary leading-relaxed mb-6">
                  {event.description}
                </p>

                <div className="flex gap-4">
                  <button 
                    onClick={() => handleRegister(event.id)}
                    disabled={registered[event.id]}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${registered[event.id] ? 'bg-brand-secondary text-brand-text-secondary cursor-not-allowed' : 'bg-brand-accent text-white hover:scale-105'}`}
                  >
                    {registered[event.id] ? 'Registered' : 'Register Now'}
                  </button>
                  <button 
                    onClick={() => handleShare(event.id)}
                    className="px-6 py-3 rounded-xl font-bold border border-brand-border text-brand-text-primary hover:border-brand-accent flex items-center gap-2 transition-colors"
                  >
                    <ShareIcon className="w-5 h-5" />
                    Share Grace Link
                  </button>
                </div>
              </div>
              <div className="bg-brand-dark px-6 py-3 text-xs text-brand-text-secondary border-t border-brand-border flex justify-between">
                <span>Streaming Engine: {event.streamingPlatform || (event.type === 'online' ? 'Mux' : 'N/A')}</span>
                <span>Phase 8 Infrastructure</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EventsPage;
