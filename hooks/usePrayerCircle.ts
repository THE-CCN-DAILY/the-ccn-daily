/**
 * usePrayerCircle — localStorage-backed prayer circle hook.
 *
 * Stores a list of people the user wants to intercede for.
 * Each day a deterministic seed (YYYY-MM-DD) selects 1-2 people
 * so the same pair surfaces consistently within a calendar day.
 *
 * Storage key: `ccn_prayer_circle_<uid>`  (falls back to `ccn_prayer_circle_guest`)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface PrayerPerson {
  id: string;
  name: string;
  relationship: string;          // e.g. "Family", "Friend", "Colleague", "Ministry"
  notes: string;                 // General notes / context
  prayerPoints: string[];        // Specific things to pray for
  photoUrl?: string;
  lastPrayedDate?: string;       // ISO date string YYYY-MM-DD
  createdAt: string;             // ISO timestamp
}

function storageKey(uid?: string | null): string {
  return `ccn_prayer_circle_${uid ?? 'guest'}`;
}

function loadPeople(uid?: string | null): PrayerPerson[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return [];
    return JSON.parse(raw) as PrayerPerson[];
  } catch {
    return [];
  }
}

function savePeople(people: PrayerPerson[], uid?: string | null): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(people));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/** Seeded integer in range [0, max) — deterministic per seed string. */
function seededInt(seed: string, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % max;
}

/** Pick up to `count` people using today's date as the seed. */
function pickTodaysPeople(people: PrayerPerson[], count: number = 2): PrayerPerson[] {
  if (people.length === 0) return [];
  if (people.length <= count) return [...people];

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const first = seededInt(today, people.length);
  const second = seededInt(today + '_2', people.length);

  const picks: PrayerPerson[] = [people[first]];
  if (count >= 2) {
    const alt = second === first ? (first + 1) % people.length : second;
    picks.push(people[alt]);
  }
  return picks;
}

function generateId(): string {
  return `pp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────

interface UsePrayerCircleReturn {
  people: PrayerPerson[];
  todaysPeople: PrayerPerson[];
  addPerson: (draft: Omit<PrayerPerson, 'id' | 'createdAt'>) => void;
  updatePerson: (id: string, patch: Partial<Omit<PrayerPerson, 'id' | 'createdAt'>>) => void;
  deletePerson: (id: string) => void;
  markPrayed: (id: string) => void;
}

export function usePrayerCircle(uid?: string | null): UsePrayerCircleReturn {
  const [people, setPeople] = useState<PrayerPerson[]>(() => loadPeople(uid));

  // Re-load from storage if the uid changes (e.g. sign-in after mount)
  useEffect(() => {
    setPeople(loadPeople(uid));
  }, [uid]);

  // Persist whenever people changes
  useEffect(() => {
    savePeople(people, uid);
  }, [people, uid]);

  const todaysPeople = useMemo(() => pickTodaysPeople(people, 2), [people]);

  const addPerson = useCallback((draft: Omit<PrayerPerson, 'id' | 'createdAt'>) => {
    const person: PrayerPerson = {
      ...draft,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPeople((prev) => [...prev, person]);
  }, []);

  const updatePerson = useCallback(
    (id: string, patch: Partial<Omit<PrayerPerson, 'id' | 'createdAt'>>) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const deletePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const markPrayed = useCallback((id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastPrayedDate: today } : p))
    );
  }, []);

  return { people, todaysPeople, addPerson, updatePerson, deletePerson, markPrayed };
}
