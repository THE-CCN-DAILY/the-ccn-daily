import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from '../components/Card';
import type { Achievement, RewardItem } from '../types';
import { FireIcon, SparklesIcon, TrophyIcon, GamificationIcon, PlusCircleIcon, CheckIcon } from '../components/icons';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { mockAchievements, mockRewards, mockEarningActions } from '../data/gamificationData';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TabButton: React.FC<{ label: string; icon: React.ElementType; isActive: boolean; onClick: () => void; }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
            isActive
            ? 'text-brand-accent border-brand-accent'
            : 'text-brand-text-secondary border-transparent hover:text-brand-text-primary'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

const AchievementItem: React.FC<{ achievement: Achievement, isUnlocked: boolean }> = ({ achievement, isUnlocked }) => (
    <div className={`flex items-center p-4 bg-brand-secondary/50 rounded-lg transition-opacity ${!isUnlocked ? 'opacity-50' : ''}`}>
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${isUnlocked ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-border/50 text-brand-text-secondary'}`}>
            <achievement.icon className="w-7 h-7" />
        </div>
        <div className="flex-grow">
            <h4 className={`font-bold ${isUnlocked ? 'text-brand-text-primary' : 'text-brand-text-secondary'}`}>{achievement.title}</h4>
            <p className="text-sm text-brand-text-secondary">{achievement.description}</p>
        </div>
        <div className="text-right ml-4">
            {isUnlocked ? (
                 <div className="flex items-center gap-2 text-sm font-semibold text-status-success">
                    <CheckIcon className="w-5 h-5"/>
                    <span>Unlocked</span>
                 </div>
            ) : (
                <div className="text-sm font-semibold text-brand-accent flex items-center gap-1">
                    <span>{achievement.points}</span>
                    <SparklesIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    </div>
);

const RewardItemCard: React.FC<{ reward: RewardItem; userPoints: number; isUnlocked: boolean; onRedeem: (cost: number) => void; }> = ({ reward, userPoints, isUnlocked, onRedeem }) => {
    const canAfford = userPoints >= reward.cost;
    return (
        <Card className="flex flex-col text-center">
            <div className="flex-shrink-0 w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-brand-secondary border-4 border-brand-dark shadow-inner mb-4">
                <reward.icon className="w-10 h-10 text-brand-accent" />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-brand-text-primary text-lg">{reward.title}</h4>
                <p className="text-sm text-brand-text-secondary">{reward.description}</p>
            </div>
            <div className="mt-4">
                {isUnlocked ? (
                    <button disabled className="w-full px-4 py-2 rounded-lg bg-status-success/20 text-status-success font-semibold flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 mr-2"/> Unlocked
                    </button>
                ) : (
                    <button 
                        onClick={() => onRedeem(reward.cost)}
                        disabled={!canAfford}
                        className="w-full px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold flex items-center justify-center disabled:bg-brand-secondary disabled:text-brand-text-secondary disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2"/>
                        <span>{reward.cost.toLocaleString()}</span>
                    </button>
                )}
            </div>
        </Card>
    );
};

const EarningActionItem: React.FC<{ action: typeof mockEarningActions[0] }> = ({ action }) => (
    <div className="flex items-center p-4 bg-brand-secondary/50 rounded-lg">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-brand-accent/20 text-brand-accent">
            <action.icon className="w-7 h-7" />
        </div>
        <div className="flex-grow">
            <h4 className="font-bold text-brand-text-primary">{action.title}</h4>
            <p className="text-sm text-brand-text-secondary">{action.description}</p>
        </div>
        <div className="text-right ml-4 text-lg font-semibold text-brand-accent flex items-center gap-1">
            <span>+{action.points}</span>
            <SparklesIcon className="w-5 h-5" />
        </div>
    </div>
);

const GamificationPage: React.FC = () => {
    const { user, signIn } = useAuth();
    const { stats, unlockedAchievements, redeemReward } = useGamification();
    const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'progress' | 'rewards' | 'earn'>('progress');
    
    const handleRedeem = (rewardId: string, cost: number) => {
        if(stats.points >= cost && !unlockedRewards.includes(rewardId)) {
            redeemReward(cost);
            setUnlockedRewards(prev => [...prev, rewardId]);
        }
    };

    if (!user) {
        return (
      <div className="max-w-5xl mx-auto pb-20">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Account</p>
          <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Your Journey
          </h1>
          <p className="text-brand-text-secondary">
            Track your progress, build consistent habits, and earn rewards for your faithfulness.
          </p>
        </motion.div>
        <Card className="text-center py-16">
          <h2 className="text-2xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>Sign In to See Your Progress</h2>
          <p className="text-brand-text-secondary mb-6">Your achievements, points, and rewards are waiting.</p>
          <button onClick={signIn} className="px-6 py-2 rounded-full bg-brand-accent hover:bg-opacity-90 text-white font-semibold shadow-md">
            Sign In
          </button>
        </Card>
      </div>
    );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Account</p>
            <h1 className="text-4xl font-black text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Your Journey
            </h1>
            <p className="text-brand-text-secondary">
              Track your progress, build consistent habits, and earn rewards for your faithfulness.
            </p>
          </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="flex items-center p-6">
                    <FireIcon className="w-16 h-16 text-orange-500 mr-6"/>
                    <div>
                        <h2 className="text-4xl font-bold text-brand-text-primary">{stats.currentStreak} Days</h2>
                        <p className="text-brand-text-secondary">Current Daily Streak</p>
                        <p className="text-xs text-brand-text-secondary/70 mt-1">Longest streak: {stats.longestStreak} days</p>
                    </div>
                </Card>
                 <Card className="flex items-center p-6">
                    <SparklesIcon className="w-16 h-16 text-brand-accent mr-6"/>
                    <div>
                        <h2 className="text-4xl font-bold text-brand-text-primary">{stats.points.toLocaleString()}</h2>
                        <p className="text-brand-text-secondary">Total Points Balance</p>
                        <p className="text-xs text-brand-text-secondary/70 mt-1">Spend these in the Rewards tab!</p>
                    </div>
                </Card>
            </div>
            
            <Card>
                <div className="flex-shrink-0 border-b border-brand-border flex items-center">
                    <TabButton label="Progress" icon={GamificationIcon} isActive={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
                    <TabButton label="How to Earn" icon={PlusCircleIcon} isActive={activeTab === 'earn'} onClick={() => setActiveTab('earn')} />
                    <TabButton label="Rewards Store" icon={TrophyIcon} isActive={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} />
                </div>
                
                <div className="p-4">
                    <AnimatePresence mode="wait">
                    {activeTab === 'progress' && (
                        <motion.div
                          key="progress"
                          className="space-y-4"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                            <h2 className="text-xl font-bold text-brand-text-primary mb-2">Your Achievements</h2>
                            {mockAchievements.map(ach => <AchievementItem key={ach.id} achievement={ach} isUnlocked={unlockedAchievements.includes(ach.id)} />)}
                        </motion.div>
                    )}

                    {activeTab === 'earn' && (
                        <motion.div
                          key="earn"
                          className="space-y-4"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                            <h2 className="text-xl font-bold text-brand-text-primary mb-2">Earn Points Through Engagement</h2>
                            {mockEarningActions.map(action => <EarningActionItem key={action.id} action={action} />)}
                        </motion.div>
                    )}

                    {activeTab === 'rewards' && (
                        <motion.div
                          key="rewards"
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                        >
                            <h2 className="text-xl font-bold text-brand-text-primary mb-2">Redeem Your Points</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                {mockRewards.map(reward => (
                                    <RewardItemCard
                                        key={reward.id}
                                        reward={reward}
                                        userPoints={stats.points}
                                        isUnlocked={unlockedRewards.includes(reward.id)}
                                        onRedeem={() => handleRedeem(reward.id, reward.cost)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
};

export default GamificationPage;