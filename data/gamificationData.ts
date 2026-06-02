import type { Achievement, UserStats, RewardItem, PointEarningAction } from '../types';
import { Trophy, Award } from 'lucide-react';
import { FireIcon, StepsIcon, ReaderIcon, SpeakerWaveIcon, NoteIcon, CheckIcon, GiftIcon, PrayingHandsIcon, ChatBubbleLeftRightIcon } from '../components/icons';


// Real users start at zero — no fabricated streak/points. The live source of truth is
// the gamification API via GamificationContext; this is only a safe empty default.
export const mockInitialStats: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    points: 0,
};

export const mockAchievements: Achievement[] = [
    { id: 'a1', title: 'First Steps', description: 'Complete your first devotional.', icon: StepsIcon, points: 10, isUnlocked: true },
    { id: 'a2', title: 'Avid Reader', description: 'Read for 7 consecutive days.', icon: ReaderIcon, points: 50, isUnlocked: true },
    { id: 'a3', title: 'Engaged Listener', description: 'Finish your first podcast episode.', icon: SpeakerWaveIcon, points: 20, isUnlocked: true },
    { id: 'a4', title: 'Perfect Week', description: 'Maintain a 7-day streak.', icon: FireIcon, points: 100, isUnlocked: true },
    { id: 'a5', title: 'Note Taker', description: 'Create your first highlight or note.', icon: NoteIcon, points: 15, isUnlocked: false },
    { id: 'a6', title: 'Community Builder', description: 'Post your first prayer request.', icon: Trophy, points: 25, isUnlocked: false },
];

export const mockRewards: RewardItem[] = [
    { id: 'r1', title: 'Exclusive Devotional', description: 'A 5-day series on "Finding Joy".', icon: ReaderIcon, cost: 1000, type: 'content' },
    { id: 'r2', title: 'Early-Access Podcast', description: 'Listen to next week\'s episode now.', icon: SpeakerWaveIcon, cost: 1500, type: 'content' },
    { id: 'r3', title: 'Gift a Course', description: 'Share the "Foundations" course with a friend.', icon: GiftIcon, cost: 2500, type: 'content' },
    { id: 'r4', title: 'Supporter Badge', description: 'Display a special badge on your profile.', icon: Award, cost: 5000, type: 'badge' },
];

export const mockEarningActions: PointEarningAction[] = [
    { id: 'e1', title: 'Daily Check-in', description: 'Open the app each day.', icon: CheckIcon, points: 5 },
    { id: 'e2', title: 'Complete a Devotional', description: 'Finish reading the daily devotional.', icon: ReaderIcon, points: 10 },
    { id: 'e3', title: 'Finish a Podcast', description: 'Listen to a podcast episode all the way through.', icon: SpeakerWaveIcon, points: 20 },
    { id: 'e4', title: 'Create a Note/Highlight', description: 'Engage with content by saving your thoughts.', icon: NoteIcon, points: 5 },
    { id: 'e5', title: 'Post a Prayer Request', description: 'Share with the community on the Prayer Wall.', icon: PrayingHandsIcon, points: 15 },
    { id: 'e6', title: 'Leave a Comment', description: 'Join the conversation on a book or podcast.', icon: ChatBubbleLeftRightIcon, points: 10 },
];