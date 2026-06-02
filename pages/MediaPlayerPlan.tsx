import React from 'react';
import Card from '../components/Card';
import type { PlanTask } from '../types';
import { FileText, Search, Headphones } from 'lucide-react';
import { SpeakerWaveIcon, SpeedIcon, ClockIcon, QueueListIcon, BookmarkSquareIcon, ShareIcon } from '../components/icons';

interface FeatureCategory {
  id: string;
  title: string;
  description: string;
  features: PlanTask[];
}

const planData: FeatureCategory[] = [
  {
    id: 'cat-1',
    title: 'Core UX & Playback Controls',
    description: 'Enhancing the fundamental listening experience with premium controls and a visually engaging interface.',
    features: [
      { id: 'f11', title: 'Variable Playback Speed', description: 'Allow users to select speeds like 0.75x, 1x, 1.25x, 1.5x, and 2x to match their listening preference.', icon: SpeedIcon },
      { id: 'f12', title: 'Sleep Timer', description: 'Users can set the player to automatically stop after a set duration (e.g., 15, 30, 60 minutes) or at the end of the episode.', icon: ClockIcon },
      { id: 'f13', title: 'Enhanced "Now Playing" UI', description: 'A beautifully designed full-screen player with a blurred background derived from the episode\'s cover art for a more immersive feel.', icon: SpeakerWaveIcon },
    ],
  },
  {
    id: 'cat-2',
    title: 'Content Engagement & Interactivity',
    description: 'Tools that help users connect more deeply with the content, turning passive listening into active learning.',
    features: [
      { id: 'f21', title: 'Synchronized Transcripts', description: 'Display a full transcript of the episode that highlights words and sentences in real-time as they are spoken.', icon: QueueListIcon },
      { id: 'f22', title: 'Chapter Markers', description: 'Allow users to see an outline of the episode and jump directly to specific topics or sections of interest.', icon: BookmarkSquareIcon },
      { id: 'f23', title: 'Clip & Share', description: 'Enable users to select a short audio snippet (e.g., 30-60 seconds), and share it directly to social media as a video clip.', icon: ShareIcon },
    ],
  },
    {
    id: 'cat-3',
    title: 'AI-Powered Discovery',
    description: 'Using Cloudflare-routed AI services to make content more accessible and personalized.',
    features: [
      { id: 'f31', title: 'AI-Generated Summaries', description: 'Provide a concise, AI-generated summary and list of key takeaways for each episode, available before listening.', icon: FileText },
      { id: 'f32', title: 'Thematic Search', description: 'Allow users to search for a topic (e.g., "forgiveness") and find all podcast episodes that discuss it, with timestamps.', icon: Search },
      { id: 'f33', title: 'Personalized Recommendations', description: 'Suggest other podcast episodes or even book chapters based on a user\'s listening history and saved notes.', icon: Headphones },
    ],
  },
];

const FeatureItem: React.FC<{ feature: PlanTask }> = ({ feature }) => (
    <div className="flex items-start space-x-4 p-4 bg-brand-secondary/50 rounded-lg h-full">
        <div className="flex-shrink-0">
            <feature.icon className="h-8 w-8 text-brand-accent"/>
        </div>
        <div>
            <h4 className="font-semibold text-brand-text-primary">{feature.title}</h4>
            <p className="text-sm text-brand-text-secondary">{feature.description}</p>
        </div>
    </div>
);


const MediaPlayerPlan: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Immersive Media Player Plan</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        This is our proposal for elevating the media experience. Please review these potential features and share your vision on what is most important for our users.
      </p>

      <div className="space-y-8">
        {planData.map((category) => (
          <Card key={category.id}>
            <div className="border-b border-brand-border pb-4 mb-4">
                <h2 className="text-2xl font-bold text-brand-accent">{category.title}</h2>
                <p className="text-brand-text-secondary mt-1">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.features.map(feature => <FeatureItem key={feature.id} feature={feature} />)}
            </div>
          </Card>
        ))}
      </div>

       <Card className="mt-8 text-center bg-brand-accent/10 border-brand-accent/50">
          <h2 className="text-2xl font-bold text-brand-text-primary mb-2">What is Your Vision?</h2>
          <p className="text-brand-text-secondary max-w-2xl mx-auto">
              Which of these features resonate most with you? Are there any missing elements that you feel are critical for the app? Your feedback will help us prioritize development and ensure we build a truly exceptional player.
          </p>
      </Card>
    </div>
  );
};

export default MediaPlayerPlan;
