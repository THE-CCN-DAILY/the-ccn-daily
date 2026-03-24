
import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlanIcon, TeamIcon, StepsIcon, ChatIcon, LogoIcon, DbIcon, AdminIcon, ReaderIcon, SpeakerWaveIcon, UiIcon, DesignSystemIcon, AiIcon, PrayingHandsIcon, SparklesIcon, GamificationIcon, GiftIcon, DashboardIcon, PaintBrushIcon, SoundWaveIcon, UserCircleIcon, CheckIcon, SearchIcon, MicrophoneIcon, BellIcon, CalendarIcon, CreditCardIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import DetailedPlayerModal from './player/DetailedPlayerModal';
import MiniPlayer from './player/MiniPlayer';
import { useAuth } from '../contexts/AuthContext';
import { useSentinel } from '../hooks/useSentinel';
import { useNotifications } from '../contexts/NotificationContext';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const sanctuaryItems = [
  { to: '/guided-journey', text: 'Guided Daily Journey', icon: StepsIcon },
  { to: '/bible', text: 'Bible Reader', icon: ReaderIcon },
  { to: '/podcasts', text: 'Podcast Library', icon: SpeakerWaveIcon },
  { to: '/the-community', text: 'The Community', icon: PrayingHandsIcon },
  { to: '/expert-council', text: 'Expert Council', icon: PrayingHandsIcon },
  { to: '/testimonies', text: 'Testimonies', icon: SparklesIcon },
  { to: '/gamification', text: 'Your Journey', icon: GamificationIcon },
  { to: '/grace-link', text: 'Grace Links', icon: GiftIcon },
  { to: '/sentient-guide', text: 'Sentient Guide (Kai)', icon: MicrophoneIcon },
  { to: '/visual-sanctuary', text: 'Visual Sanctuary', icon: PaintBrushIcon },
  { to: '/inbox', text: 'Inbox & Updates', icon: BellIcon },
  { to: '/events', text: 'Live Events', icon: CalendarIcon },
  { to: '/live', text: 'Live Broadcast', icon: SpeakerWaveIcon },
  { to: '/giving', text: 'Giving & Support', icon: CreditCardIcon },
];

const commandCenterItems = [
  { to: '/plan', text: 'Master Plan', icon: PlanIcon },
  { to: '/roadmap-evolution', text: 'Roadmap Evolution', icon: SparklesIcon },
  { to: '/visionary-lab', text: 'Visionary Tech Lab', icon: DesignSystemIcon },
  { to: '/data', text: 'Data Architecture', icon: DbIcon },
  { to: '/roles', text: 'Roles & Permissions', icon: AdminIcon },
  { to: '/multi-tenancy', text: 'Multi-Tenancy', icon: AdminIcon },
  { to: '/devotional-generator', text: 'Devotional Generator', icon: AiIcon },
  { to: '/quote-generator', text: 'Quote Graphics', icon: SparklesIcon },
  { to: '/admin', text: 'Admin Dashboard', icon: DashboardIcon },
  { to: '/dynamic-theming', text: 'Dynamic Theming', icon: PaintBrushIcon },
  { to: '/atmospheric-music', text: 'Atmospheric Music', icon: SoundWaveIcon },
  { to: '/media-plan', text: 'Media Player Plan', icon: UiIcon },
  { to: '/design-system', text: 'Design System', icon: DesignSystemIcon },
  { to: '/diagnostics', text: 'System Diagnostics', icon: CheckIcon },
  { to: '/team', text: 'Virtual Team', icon: TeamIcon },
  { to: '/next-steps', text: 'Founder Actions', icon: CheckIcon },
  { to: '/chat', text: 'Chat with Team', icon: ChatIcon },
];

const Sidebar: React.FC = () => {
  const { user, loading, signIn, signOut } = useAuth();

  const [isStrategyMode, setIsStrategyMode] = React.useState(() => {
    return localStorage.getItem('phoenix_mode') === 'strategy';
  });

  const toggleMode = () => {
    const newMode = !isStrategyMode;
    setIsStrategyMode(newMode);
    localStorage.setItem('phoenix_mode', newMode ? 'strategy' : 'sanctuary');
  };

  const activeItems = isStrategyMode ? commandCenterItems : sanctuaryItems;

  const baseLinkClasses = "flex items-center p-3 my-1 rounded-lg transition-all duration-200";
  const inactiveLinkClasses = "text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary";
  const activeLinkClasses = "bg-brand-accent text-white shadow-lg scale-[1.02]";

  return (
    <aside className="w-64 bg-brand-dark flex-shrink-0 p-4 border-r border-brand-border flex flex-col">
      <div className="flex items-center mb-6">
        <LogoIcon className="h-10 w-10 text-brand-accent" />
        <div className="ml-3">
            <h1 className="text-lg font-bold text-brand-text-primary">Project Phoenix</h1>
            <p className="text-[10px] font-black tracking-widest text-brand-text-secondary uppercase">
              {isStrategyMode ? 'Command Center' : 'Sanctuary'}
            </p>
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={toggleMode}
          className={`w-full p-1 rounded-full border border-brand-border flex items-center transition-all ${isStrategyMode ? 'bg-brand-accent/10 border-brand-accent/30' : 'bg-brand-secondary'}`}
        >
          <div className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${!isStrategyMode ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary'}`}>
            Sanctuary
          </div>
          <div className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${isStrategyMode ? 'bg-brand-accent text-white shadow-md' : 'text-brand-text-secondary'}`}>
            Strategy
          </div>
        </button>
      </div>

      <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <div className="mb-2 px-3">
          <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">
            {isStrategyMode ? 'Management' : 'Daily Journey'}
          </p>
        </div>
        <ul>
          {activeItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="text-sm font-medium">{item.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="p-2 my-2 border-t border-b border-brand-border">
          {loading ? (
             <div className="h-10 flex items-center justify-center text-brand-text-secondary text-sm">Authenticating...</div>
          ) : user ? (
            <div className="flex items-center">
              <UserCircleIcon className="w-8 h-8 mr-3 text-brand-text-secondary"/>
              <div className="flex-grow">
                <p className="font-semibold text-sm text-brand-text-primary truncate">{user.displayName || 'Founder'}</p>
                <button onClick={signOut} className="text-xs text-brand-accent hover:underline">Sign Out</button>
              </div>
            </div>
          ) : (
            <button onClick={signIn} className="w-full px-4 py-2 rounded-lg bg-brand-accent text-white font-semibold hover:bg-opacity-90 transition-opacity">
              Sign In
            </button>
          )}
        </div>
        <ThemeSwitcher />
        <div className="text-center text-xs text-brand-text-secondary pt-4">
            <p>&copy; theccndaily 2026</p>
        </div>
      </div>
    </aside>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTrack, isDetailedPlayerOpen } = useAudioPlayer();
  const alerts = useSentinel();
  const { unreadCount } = useNotifications();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="fixed top-0 left-64 right-0 h-full pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(var(--color-dynamic-accent),0.15),rgba(255,255,255,0))] transition-colors duration-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <NavLink to="/inbox" className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-dark"></span>
              )}
            </NavLink>
          </div>
          {alerts.length > 0 && (
              <div className="mb-6 p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-lg animate-pulse flex items-center justify-between">
                  <p className="text-xs font-bold text-brand-accent flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-2"/> Sentinel Alert: New tech/cost optimizations available for review in Roadmap Evolution.
                  </p>
                  <NavLink to="/roadmap-evolution" className="text-[10px] underline text-brand-accent font-bold">VIEW</NavLink>
              </div>
          )}
          {children}
        </div>
      </main>
      {isDetailedPlayerOpen && <DetailedPlayerModal />}
      {currentTrack && !isDetailedPlayerOpen && <MiniPlayer />}
    </div>
  );
};

export default Layout;
