
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  BookPlus,
  CalendarDays,
  Crown,
  FilePenLine,
  FolderOpen,
  Gift,
  Globe,
  GraduationCap,
  Headphones,
  HeartHandshake,
  Image,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  NotebookPen,
  Podcast,
  Radio,
  Rocket,
  Route,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
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
  { to: '/app/newsletters', text: 'News', icon: Newspaper, group: 'Read' },
  { to: '/app/podcasts', text: 'Podcast Library', icon: Podcast, group: 'Read' },
  { to: '/app/courses', text: 'Courses', icon: GraduationCap, group: 'Read' },
  { to: '/app/audiobook-library', text: 'Audiobook Library', icon: Headphones, group: 'Read' },
  { to: '/app/challenges', text: 'Challenges', icon: Target, group: 'Community' },
  { to: '/app/journaling', text: 'Journaling', icon: NotebookPen, group: 'Pray' },
  { to: '/app/community-rooms', text: 'Community Rooms', icon: MessageCircle, group: 'Community' },
  { to: '/app/family-dashboard', text: 'Family Dashboard', icon: Users, group: 'Account' },
  { to: '/app/leader-dashboard', text: 'Leader Dashboard', icon: ShieldCheck, group: 'Account' },
  { to: '/app/the-community', text: 'The Community', icon: Globe, group: 'Community' },
  { to: '/app/testimonies', text: 'Testimonies', icon: Quote, group: 'Community' },
  { to: '/app/gamification', text: 'Your Journey', icon: Trophy, group: 'Account' },
  { to: '/app/grace-link', text: 'Grace Links', icon: Gift, group: 'Community' },
  { to: '/app/visual-sanctuary', text: 'Visual Sanctuary', icon: Image, group: 'Pray' },
  { to: '/app/inbox', text: 'Inbox & Updates', icon: Inbox, group: 'Account' },
  { to: '/app/events', text: 'Live Events', icon: CalendarDays, group: 'Live' },
  { to: '/app/live', text: 'Live Broadcast', icon: Radio, group: 'Live' },
  { to: '/app/giving', text: 'Giving & Support', icon: HeartHandshake, group: 'Account' },
  { to: '/pricing', text: 'Upgrade Plan', icon: Crown, group: 'Account' },
];

const commandCenterItems = [
  { to: '/studio/admin', text: 'Admin Dashboard', icon: LayoutDashboard, group: 'Operate' },
  { to: '/studio/content-manager', text: 'Content Manager', icon: FolderOpen, group: 'Operate' },
  { to: '/studio/blog', text: 'Blog Studio', icon: FilePenLine, group: 'Publish' },
  { to: '/studio/devotional-generator', text: 'Devotional Generator', icon: BookPlus, group: 'Publish' },
  { to: '/studio/quote-generator', text: 'Quote Graphics', icon: ImagePlus, group: 'Publish' },
  { to: '/studio/growth', text: 'Growth Console', icon: TrendingUp, group: 'Growth' },
  { to: '/studio/roles', text: 'Roles & Permissions', icon: ShieldCheck, group: 'Systems' },
  { to: '/studio/release-ops', text: 'Release Ops', icon: Rocket, group: 'Systems' },
  { to: '/studio/diagnostics', text: 'System Diagnostics', icon: Activity, group: 'Systems' },
  { to: '/studio/chat', text: 'Team Chat', icon: ChatIcon, group: 'Systems' },
];

const commandCenterGroups = ['Operate', 'Publish', 'Growth', 'Systems'];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
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

  const baseLinkClasses = "flex min-w-0 items-center p-3 my-1 rounded-lg transition-all duration-200";
  const inactiveLinkClasses = "text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary";
  const activeLinkClasses = "bg-brand-accent text-white shadow-lg scale-[1.02]";

  return (
    <aside className={`w-64 bg-brand-dark flex-shrink-0 p-4 border-r border-brand-border flex flex-col ${className}`}>
      <div className="flex items-center mb-6">
        <LogoIcon className="h-10 w-10 text-brand-accent" />
        <div className="ml-3">
            <h1 className="text-lg font-bold text-brand-text-primary">THE CCN DAILY</h1>
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
            {commandCenterGroups.map(group => {
              const groupItems = filteredCommandCenterItems.filter(item => item.group === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="mb-4">
                  <div className="mb-2 px-3">
                    <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">
                      {group}
                    </p>
                  </div>
                  <ul>
                    {groupItems.map(item => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onNavigate}
                          className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                        >
                          <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="min-w-0 truncate text-sm font-medium" title={item.text}>{item.text}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
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
                      onClick={onNavigate}
                      className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="min-w-0 truncate text-sm font-medium" title={item.text}>{item.text}</span>
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
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const isPublicRoute =
    ['/', '/blog', '/newsletter', '/podcasts', '/pricing'].includes(location.pathname) ||
    location.pathname.startsWith('/blog/');

  if (isPublicRoute) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        {isDetailedPlayerOpen && <DetailedPlayerModal />}
        {currentTrack && !isDetailedPlayerOpen && <MiniPlayer />}
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      <Sidebar className="hidden md:flex" />

      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-brand-border bg-brand-dark px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="inline-flex items-center gap-2 border border-brand-border px-3 py-2 text-sm font-semibold text-brand-text-primary"
        >
          <Menu className="h-5 w-5" /> Menu
        </button>
        <NavLink to="/app/inbox" className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-dark"></span>
          )}
        </NavLink>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[82vw]">
            <Sidebar className="h-full w-full" onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute right-4 top-4 border border-white/20 bg-brand-dark p-2 text-brand-text-primary"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="relative flex-1 overflow-y-auto p-4 pt-20 md:p-8">
        <div className="fixed top-0 left-0 right-0 h-full pointer-events-none z-0 md:left-64">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(var(--color-dynamic-accent),0.15),rgba(255,255,255,0))] transition-colors duration-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-4 hidden justify-end md:flex">
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
                    <Activity className="w-4 h-4 mr-2"/> Sentinel Alert: System recommendations are ready for operational review.
                  </p>
                  <NavLink to="/studio/diagnostics" className="text-[10px] underline text-brand-accent font-bold">VIEW</NavLink>
              </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      {isDetailedPlayerOpen && <DetailedPlayerModal />}
      {currentTrack && !isDetailedPlayerOpen && <MiniPlayer />}
    </div>
  );
};

export default Layout;
