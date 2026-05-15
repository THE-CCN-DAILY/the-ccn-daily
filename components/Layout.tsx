
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  BookPlus,
  Building2,
  CalendarDays,
  ClipboardList,
  Component,
  Crown,
  Database,
  FlaskConical,
  FilePenLine,
  FolderOpen,
  Gift,
  GraduationCap,
  Headphones,
  HeartHandshake,
  Image,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Map,
  MessagesSquare,
  Mic,
  Music,
  Newspaper,
  NotebookPen,
  Palette,
  Radio,
  Rocket,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  Users,
  Quote,
} from 'lucide-react';
import { ChatIcon, LogoIcon, UserCircleIcon, BellIcon } from './icons';
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
  { to: '/app/guided-journey', text: 'Guided Daily Journey', icon: Route, group: 'Pray' },
  { to: '/app/bible', text: 'Bible Reader', icon: BookOpen, group: 'Read' },
  { to: '/app/newsletters', text: 'The CCN Daily News', icon: Newspaper, group: 'Read' },
  { to: '/app/podcasts', text: 'Podcast Library', icon: Headphones, group: 'Read' },
  { to: '/app/courses', text: 'Courses', icon: GraduationCap, group: 'Read' },
  { to: '/app/audiobook-library', text: 'Audiobook Library', icon: Headphones, group: 'Read' },
  { to: '/app/challenges', text: 'Challenges', icon: Trophy, group: 'Community' },
  { to: '/app/journaling', text: 'Journaling', icon: NotebookPen, group: 'Pray' },
  { to: '/app/community-rooms', text: 'Community Rooms', icon: MessagesSquare, group: 'Community' },
  { to: '/app/family-dashboard', text: 'Family Dashboard', icon: Users, group: 'Account' },
  { to: '/app/leader-dashboard', text: 'Leader Dashboard', icon: ShieldCheck, group: 'Account' },
  { to: '/app/the-community', text: 'The Community', icon: MessagesSquare, group: 'Community' },
  { to: '/app/expert-council', text: 'Expert Council', icon: UserRoundCheck, group: 'Community' },
  { to: '/app/testimonies', text: 'Testimonies', icon: Quote, group: 'Community' },
  { to: '/app/gamification', text: 'Your Journey', icon: Trophy, group: 'Account' },
  { to: '/app/grace-link', text: 'Grace Links', icon: Gift, group: 'Community' },
  { to: '/app/sentient-guide', text: 'Sentient Guide (Kai)', icon: Mic, group: 'Pray' },
  { to: '/app/visual-sanctuary', text: 'Visual Sanctuary', icon: Image, group: 'Pray' },
  { to: '/app/inbox', text: 'Inbox & Updates', icon: Inbox, group: 'Account' },
  { to: '/app/events', text: 'Live Events', icon: CalendarDays, group: 'Live' },
  { to: '/app/live', text: 'Live Broadcast', icon: Radio, group: 'Live' },
  { to: '/app/giving', text: 'Giving & Support', icon: HeartHandshake, group: 'Account' },
  { to: '/pricing', text: 'Upgrade Plan', icon: Crown, group: 'Account' },
];

const commandCenterItems = [
  { to: '/studio/admin', text: 'Admin Dashboard', icon: LayoutDashboard },
  { to: '/studio/blog', text: 'Blog Studio', icon: FilePenLine },
  { to: '/studio/plan', text: 'Master Plan', icon: ClipboardList },
  { to: '/studio/roadmap-evolution', text: 'Roadmap Evolution', icon: Map },
  { to: '/studio/visionary-lab', text: 'Visionary Tech Lab', icon: FlaskConical },
  { to: '/studio/content-manager', text: 'Content Manager', icon: FolderOpen },
  { to: '/studio/data', text: 'Data Architecture', icon: Database },
  { to: '/studio/roles', text: 'Roles & Permissions', icon: ShieldCheck },
  { to: '/studio/multi-tenancy', text: 'Multi-Tenancy', icon: Building2 },
  { to: '/studio/devotional-generator', text: 'Devotional Generator', icon: BookPlus },
  { to: '/studio/quote-generator', text: 'Quote Graphics', icon: ImagePlus },
  { to: '/studio/dynamic-theming', text: 'Dynamic Theming', icon: Palette },
  { to: '/studio/atmospheric-music', text: 'Atmospheric Music', icon: Music },
  { to: '/studio/media-plan', text: 'Media Player Plan', icon: SlidersHorizontal },
  { to: '/studio/design-system', text: 'Design System', icon: Component },
  { to: '/studio/growth', text: 'Growth Console', icon: TrendingUp },
  { to: '/studio/release-ops', text: 'Release Ops', icon: Rocket },
  { to: '/studio/diagnostics', text: 'System Diagnostics', icon: Activity },
  { to: '/studio/team', text: 'Virtual Team', icon: Users },
  { to: '/studio/next-steps', text: 'Founder Actions', icon: ListTodo },
  { to: '/studio/chat', text: 'Chat with Team', icon: ChatIcon },
];

const Sidebar: React.FC = () => {
  const { user, loading, signIn, signOut } = useAuth();

  const [isStrategyMode, setIsStrategyMode] = React.useState(() => {
    return localStorage.getItem('phoenix_mode') === 'strategy';
  });

  const { notify } = useNotifications();

  const toggleMode = () => {
    if (user?.role !== 'admin' && user?.role !== 'lead_developer') {
      notify("Strategy mode is reserved for Admins and Lead Developers.", "error");
      return;
    }
    const newMode = !isStrategyMode;
    setIsStrategyMode(newMode);
    localStorage.setItem('phoenix_mode', newMode ? 'strategy' : 'sanctuary');
  };

  const filteredCommandCenterItems = commandCenterItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'lead_developer') {
      return ['/studio/visionary-lab', '/studio/data', '/studio/design-system', '/studio/diagnostics', '/studio/release-ops', '/studio/content-manager', '/studio/challenges/:challengeId/modules', '/studio/courses/:courseId/modules'].includes(item.to) || item.to.startsWith('/studio/content-manager') || item.to.startsWith('/studio/release-ops');
    }
    return false;
  });

  const filteredSanctuaryItems = sanctuaryItems.filter(item => {
    if (item.to === '/app/family-dashboard') {
      return user?.role === 'admin' || user?.role === 'family_lead';
    }
    if (item.to === '/app/leader-dashboard') {
      return user?.role === 'admin' || user?.role === 'group_lead';
    }
    return true;
  });

  const activeItems = isStrategyMode ? filteredCommandCenterItems : filteredSanctuaryItems;

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
        {isStrategyMode ? (
          <>
            <div className="mb-2 px-3">
              <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">
                Management
              </p>
            </div>
            <ul>
              {filteredCommandCenterItems.map(item => (
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
          </>
        ) : (
          ['Read', 'Pray', 'Community', 'Live', 'Account'].map(group => (
            <div key={group} className="mb-4">
              <div className="mb-2 px-3">
                <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">
                  {group}
                </p>
              </div>
              <ul>
                {filteredSanctuaryItems.filter(item => item.group === group).map(item => (
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
            </div>
          ))
        )}
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
  const location = useLocation();
  const { currentTrack, isDetailedPlayerOpen } = useAudioPlayer();
  const alerts = useSentinel();
  const { unreadCount } = useNotifications();
  const isPublicRoute =
    ['/', '/blog', '/newsletter', '/podcasts', '/pricing'].includes(location.pathname) ||
    location.pathname.startsWith('/blog/');

  if (isPublicRoute) {
    return (
      <>
        {children}
        {isDetailedPlayerOpen && <DetailedPlayerModal />}
        {currentTrack && !isDetailedPlayerOpen && <MiniPlayer />}
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="fixed top-0 left-64 right-0 h-full pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(var(--color-dynamic-accent),0.15),rgba(255,255,255,0))] transition-colors duration-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <NavLink to="/app/inbox" className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-dark"></span>
              )}
            </NavLink>
          </div>
          {alerts.length > 0 && (
              <div className="mb-6 p-3 bg-brand-accent/10 border border-brand-accent/30 rounded-lg animate-pulse flex items-center justify-between">
                  <p className="text-xs font-bold text-brand-accent flex items-center">
                    <Activity className="w-4 h-4 mr-2"/> Sentinel Alert: New tech/cost optimizations available for review in Roadmap Evolution.
                  </p>
                  <NavLink to="/studio/roadmap-evolution" className="text-[10px] underline text-brand-accent font-bold">VIEW</NavLink>
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
