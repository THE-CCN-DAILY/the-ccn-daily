// Mock service for atmospheric prayer music.
// In a real application, this would use a production audio provider
// to generate real-time ambient music based on a mood analysis of the content.

import type { Mood } from '../types';

// Using royalty-free placeholder music from a reliable CDN for the prototype to avoid CORS issues.
const musicMap: Record<Mood, { title: string; url: string }> = {
    Reflective: {
        title: "Gentle Contemplation",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    Joyful: {
        title: "Uplifting Spirit",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    Hopeful: {
        title: "Peaceful Dawn",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    },
    Courageous: {
        title: "Resolute Heart",
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    },
};

export const getAtmosphericMusic = async (mood: Mood): Promise<{ title: string, url: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return musicMap[mood];
};
