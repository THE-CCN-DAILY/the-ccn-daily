import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { CalendarIcon, ShareIcon, UserIcon } from '../components/icons';

const EASE = [0.2, 0.6, 0.2, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { AppEvent, listEvents, registerForEvent } from '../services/eventService';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setLoading(true);
      setError('');

      try {
        const fetchedEvents = await listEvents();
        if (!cancelled) setEvents(fetchedEvents);
      } catch (error) {
        if (!cancelled) {
          setError('Events could not be loaded. Please try again shortly.');
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRegister = async (id: string) => {
    try {
      const updatedEvent = await registerForEvent(id, user?.uid || user?.email || 'anonymous');
      if (updatedEvent) {
        setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      }
      setRegistered(prev => ({ ...prev, [id]: true }));
      notify('Successfully registered! A Grace Link has been sent to your email.', 'success');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to register for event.', 'error');
    }
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/#/app/events?event=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(shareUrl);
    notify('Grace Link copied to clipboard! Share this link to invite others.', 'success');
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <p style={{ fontFamily: 'var(--sans-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E87A2C' }} className="mb-2">Live</p>
        <h1 className="text-4xl text-brand-text-primary mb-2" style={{ fontFamily: 'var(--serif-display, var(--font-display))', fontWeight: 600, lineHeight: 1.2 }}>
          Live Events
        </h1>
        <p style={{ fontFamily: 'var(--serif-body)', fontSize: '18px', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>Gatherings, conferences, and encounters — join the body in real time.</p>
      </motion.div>

      {error && (
        <Card className="mb-6 border-status-warning/40 bg-status-warning/10">
          <p className="text-sm text-brand-text-secondary">{error}</p>
        </Card>
      )}

      <motion.div
        className="space-y-6"
        variants={stagger} initial="hidden" animate="visible"
      >
        {events.length === 0 && !error ? (
          <motion.div variants={fadeUp} transition={{ duration: 0.42, ease: EASE }}>
          <Card className="p-12 text-center">
            <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-brand-text-secondary opacity-20" />
            <p className="text-brand-text-secondary">No upcoming events at the moment. Check back soon!</p>
          </Card>
          </motion.div>
        ) : (
          events.map(event => (
            <motion.div key={event.id} variants={fadeUp} transition={{ duration: 0.42, ease: EASE }}>
            <Card className="overflow-hidden p-0" style={{ background: 'var(--bg-card, #FBF6EA)', boxShadow: 'var(--sh-card, 0 1px 2px rgba(42,28,21,.06), 0 8px 24px rgba(42,28,21,.05))', borderRadius: '6px', borderTop: '2px solid #E87A2C' }}>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-2 text-2xl" style={{ fontFamily: 'var(--serif-display, var(--font-display))', fontWeight: 600, color: 'var(--fg-1, #2A1C15)' }}>{event.title}</h2>
                    <p className="flex items-center gap-2" style={{ fontFamily: 'var(--sans-ui)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E87A2C' }}>
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-brand-secondary/50 px-3 py-1" style={{ fontFamily: 'var(--sans-ui)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3, #8A7A6A)' }}>
                    <UserIcon className="h-4 w-4" />
                    {event.attendeeCount} Registered
                  </div>
                </div>

                <p className="mb-6" style={{ fontFamily: 'var(--serif-body)', lineHeight: 1.65, color: 'var(--fg-2, #5B4A3C)' }}>
                  {event.description}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={registered[event.id]}
                    className={`rounded-xl px-6 py-3 font-bold transition-all ${registered[event.id] ? 'cursor-not-allowed bg-brand-secondary text-brand-text-secondary' : 'bg-brand-accent text-white hover:scale-105'}`}
                  >
                    {registered[event.id] ? 'Registered' : 'Register Now'}
                  </button>
                  <button
                    onClick={() => handleShare(event.id)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-brand-border px-6 py-3 font-bold text-brand-text-primary transition-colors hover:border-brand-accent"
                  >
                    <ShareIcon className="h-5 w-5" />
                    Share Grace Link
                  </button>
                </div>
              </div>
              <div className="flex justify-between border-t border-brand-border px-6 py-3" style={{ fontFamily: 'var(--sans-ui)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-3, #8A7A6A)', background: 'rgba(42,28,21,0.04)' }}>
                <span>Streaming Engine: {event.streamingPlatform || (event.type === 'online' ? 'Mux' : 'N/A')}</span>
                <span>Live event desk</span>
              </div>
            </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default EventsPage;
