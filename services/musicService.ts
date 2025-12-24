// Mock service for Atmospheric AI Music.
// In a real application, this would use Google's Lyria model via Genkit
// to generate real-time ambient music based on a mood analysis of the content.

import type { Mood } from '../types';

// Using royalty-free placeholder music from a reliable CDN for the prototype to avoid CORS issues.
const musicMap: Record<Mood, { title: string; url: string }> = {
    Reflective: {
        title: "Gentle Contemplation",
        url: 'https://storage.googleapis.com/media-session/sintel/things-can-get-worse.mp3'
    },
    Joyful: {
        title: "Uplifting Spirit",
        url: 'https://storage.googleapis.com/media-session/sintel/snow-fight.mp3'
    },
    Hopeful: {
        title: "Peaceful Dawn",
        url: 'https://storage.googleapis.com/media-session/sintel/survivor.mp3'
    },
    Courageous: {
        title: "Resolute Heart",
        url: 'https://storage.googleapis.com/media-session/sintel/train-ride.mp3'
    },
};

export const getAtmosphericMusic = async (mood: Mood): Promise<{ title: string, url: string }> => {
  console.log(`Simulating Lyria API call for mood: ${mood}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return musicMap[mood];
};