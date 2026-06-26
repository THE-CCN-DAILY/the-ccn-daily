
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BookMarked,
  BookOpen,
  BookPlus,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  Crown,
  FilePenLine,
  PenLine,
  FolderOpen,
  Gift,
  Globe,
  Heart,
  GraduationCap,
  Headphones,
  HeartHandshake,
  HelpCircle,
  Image,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  Library,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  NotebookPen,
  Podcast,
  Radio,
  Rocket,
  Route,
  Settings,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Quote,
} from 'lucide-react';
import { ChatIcon, UserCircleIcon, BellIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';
import CcnLogo from './CcnLogo';
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
  { to: '/dashboard', text: 'Dashboard', icon: LayoutDashboard, group: 'Account' },
  { to: '/guided-journey', text: 'Guided Daily Journey', icon: Route, group: 'Pray' },
  { to: '/devotional', text: 'Your Devotional', icon: PenLine, group: 'Pray' },
  { to: '/planner', text: 'Daily Planner', icon: CalendarCheck, group: 'Pray' },
  { to: '/bible', text: 'Bible Reader', icon: BookOpen, group: 'Read' },
  { to: '/books', text: 'Books', icon: BookMarked, group: 'Read' },
  { to: '/reading-plans', text: 'Reading Plans', icon: Calendar, group: 'Read' },
  { to: '/newsletters', text: 'News', icon: Newspaper, group: 'Read' },
  { to: '/podcast-library', text: 'Podcast Library', icon: Podcast, group: 'Read' },
  { to: '/courses', text: 'Courses', icon: GraduationCap, group: 'Read' },
  { to: '/audiobook-library', text: 'Audiobook Library', icon: Headphones, group: 'Read' },
  { to: '/challenges', text: 'Challenges', icon: Target, group: 'Community' },
  { to: '/journaling', text: 'Journaling', icon: NotebookPen, group: 'Pray' },
  { to: '/prayer-circle', text: 'Prayer Circle', icon: Heart, group: 'Pray' },
  { to: '/community-rooms', text: 'Community Rooms', icon: MessageCircle, group: 'Community' },
  { to: '/family-dashboard', text: 'Family Dashboard', icon: Users, group: 'Account' },
  { to: '/leader-dashboard', text: 'Leader Dashboard', icon: ShieldCheck, group: 'Account' },
  { to: '/the-community', text: 'The Community', icon: Globe, group: 'Community' },
  { to: '/testimonies', text: 'Testimonies', icon: Quote, group: 'Community' },
  { to: '/library', text: 'Your Library', icon: Library, group: 'Account' },
  { to: '/gamification', text: 'Your Journey', icon: Trophy, group: 'Account' },
  { to: '/grace-link', text: 'Grace Links', icon: Gift, group: 'Community' },
  { to: '/inbox', text: 'Inbox & Updates', icon: Inbox, group: 'Account' },
  { to: '/settings', text: 'Settings', icon: Settings, group: 'Account' },
  { to: '/events', text: 'Live Events', icon: CalendarDays, group: 'Live' },
  // Hidden until Cloudflare Stream is enabled (video subscription). Route still exists for
  // admin testing; restore this nav item once Stream is live.
  // { to: '/live', text: 'Live Broadcast', icon: Radio, group: 'Live' },
  { to: '/give', text: 'Give', icon: HeartHandshake, group: 'Account' },
  { to: '/giving', text: 'Giving & Support', icon: HeartHandshake, group: 'Account' },
  { to: '/pricing', text: 'Upgrade Plan', icon: Crown, group: 'Account' },
  { to: '/help', text: 'Help & Contact', icon: HelpCircle, group: 'Account' },
];

const commandCenterItems = [
  { to: '/studio/admin', text: 'Admin Dashboard', icon: LayoutDashboard, group: 'Operate' },
  { to: '/studio/content-manager', text: 'Content Manager', icon: FolderOpen, group: 'Operate' },
  { to: '/studio/comments', text: 'Comment Moderation', icon: MessagesSquare, group: 'Operate' },
  { to: '/studio/reviews', text: 'Review Moderation', icon: Star, group: 'Operate' },
  { to: '/studio/scholarships', text: 'Scholarships', icon: HeartHandshake, group: 'Operate' },
  { to: '/studio/blog', text: 'Blog Studio', icon: FilePenLine, group: 'Publish' },
  { to: '/studio/announcements', text: 'Announcements', icon: Megaphone, group: 'Growth' },
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
  /** Desktop sidebar can collapse to an icon rail; the mobile drawer never collapses. */
  collapsible?: boolean;
}

const sanctuaryGroupColors: Record<string, string> = {
  'Pray': 'var(--crimson, #8E1B1B)',
  'Read': 'var(--ember, #C23B1E)',
  'Community': 'var(--amber-ds, #E87A2C)',
  'Live': 'var(--amber-ds, #E87A2C)',
  'Account': 'var(--gold-ds, #B7892E)',
};

const groupLabelStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase' as const,
  color,
});

const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate, collapsible = false }) => {
  const { user, loading, openSignIn, signOut } = useAuth();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem('phoenix_sidebar_collapsed') === '1');
  const collapsed = collapsible && isCollapsed;
  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('phoenix_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  // Only ministry operators may even SEE the Strategy/Command Center surface. Regular
  // members never see it, and they are restricted to the Sanctuary.
  const canStrategy = user?.role === 'admin' || user?.role === 'lead_developer';
  const effectiveStrategyMode = location.pathname.startsWith('/studio') && canStrategy;

  const filteredCommandCenterItems = commandCenterItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'lead_developer') {
      return ['/studio/visionary-lab', '/studio/data', '/studio/design-system', '/studio/diagnostics', '/studio/release-ops', '/studio/content-manager', '/studio/challenges/:challengeId/modules', '/studio/courses/:courseId/modules'].includes(item.to) || item.to.startsWith('/studio/content-manager') || item.to.startsWith('/studio/release-ops');
    }
    return false;
  });

  const filteredSanctuaryItems = sanctuaryItems.filter(item => {
    if (item.to === '/family-dashboard') {
      return user?.role === 'admin' || user?.role === 'family_lead';
    }
    if (item.to === '/leader-dashboard') {
      return user?.role === 'admin' || user?.role === 'group_lead';
    }
    return true;
  });

  const activeItems = effectiveStrategyMode ? filteredCommandCenterItems : filteredSanctuaryItems;

  const baseLinkClasses = `flex min-w-0 items-center ${collapsed ? 'justify-center p-2.5' : 'p-3'} my-0.5 rounded-lg transition-all duration-200`;
  const inactiveLinkClasses = "text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary";
  // Refined active state: accent-tinted fill + orange text + left accent line — inspired by Linear/Arc
  const activeLinkClasses = collapsed
    ? "bg-brand-accent/[0.13] text-brand-accent"
    : "bg-brand-accent/[0.13] text-brand-accent font-semibold border-l-2 border-brand-accent pl-[10px]";

  return (
    <aside className={`${collapsed ? 'w-[76px] p-2' : 'w-64 p-4'} bg-brand-dark flex-shrink-0 border-r border-brand-border flex flex-col transition-all duration-200 ${className}`}>
      <div className={`mb-6 flex ${collapsed ? 'flex-col items-center gap-3' : 'items-start justify-between gap-2'}`}>
        {!collapsed && (
          <div className="flex flex-col gap-1 min-w-0">
            <NavLink to="/dashboard" onClick={onNavigate} aria-label="THE CCN DAILY — dashboard">
              <CcnLogo size="sm" theme="auto" />
            </NavLink>
            <p style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-ds, #B7892E)', fontWeight: 600 }}>
              {effectiveStrategyMode ? 'Command Center' : 'Sanctuary'}
            </p>
          </div>
        )}
        {collapsible && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            className="p-2 rounded-lg text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary transition-colors flex-shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        )}
      </div>


      <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        {effectiveStrategyMode ? (
          <>
            {commandCenterGroups.map(group => {
              const groupItems = filteredCommandCenterItems.filter(item => item.group === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="mb-4">
                  {!collapsed && (
                    <div className="mb-2 px-3">
                      <p style={groupLabelStyle('var(--crimson, #8E1B1B)')}>
                        {group}
                      </p>
                    </div>
                  )}
                  <ul>
                    {groupItems.map(item => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onNavigate}
                          title={collapsed ? item.text : undefined}
                          className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                        >
                          <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                          {!collapsed && <span className="min-w-0 truncate text-sm font-medium" title={item.text}>{item.text}</span>}
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
              {!collapsed && (
                <div className="mb-2 px-3">
                  <p style={groupLabelStyle(sanctuaryGroupColors[group] ?? 'var(--crimson, #8E1B1B)')}>
                    {group}
                  </p>
                </div>
              )}
              <ul>
                {filteredSanctuaryItems.filter(item => item.group === group).map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      title={collapsed ? item.text : undefined}
                      className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                      {!collapsed && <span className="min-w-0 truncate text-sm font-medium" title={item.text}>{item.text}</span>}
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
             <div className={`h-10 flex items-center justify-center text-brand-text-secondary text-sm ${collapsed ? '' : ''}`}>{collapsed ? '…' : 'Authenticating...'}</div>
          ) : user ? (
            collapsed ? (
              <NavLink to="/settings" title={user.displayName || 'Account'} className="flex items-center justify-center py-1">
                <UserCircleIcon className="w-8 h-8 text-brand-text-secondary hover:text-brand-accent transition-colors" />
              </NavLink>
            ) : (
              <div className="flex items-center">
                <UserCircleIcon className="w-8 h-8 mr-3 text-brand-text-secondary"/>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-sm text-brand-text-primary truncate">{user.displayName || (user.role === 'admin' || user.role === 'lead_developer' ? 'Founder' : 'Member')}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <button onClick={signOut} className="text-xs text-brand-accent hover:underline">Sign Out</button>
                    {canStrategy && (
                      <>
                        <span className="text-[10px] text-brand-text-secondary opacity-40">•</span>
                        <NavLink
                          to={effectiveStrategyMode ? "/dashboard" : "/studio/admin"}
                          className="text-xs text-brand-accent hover:underline font-semibold"
                        >
                          {effectiveStrategyMode ? "Sanctuary" : "Admin Studio"}
                        </NavLink>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <button onClick={() => openSignIn()} title="Sign In" className={`rounded-lg bg-brand-accent text-white font-semibold hover:bg-opacity-90 transition-opacity ${collapsed ? 'w-full flex items-center justify-center py-2' : 'w-full px-4 py-2'}`}>
              {collapsed ? <UserCircleIcon className="w-5 h-5" /> : 'Sign In'}
            </button>
          )}
        </div>
        {!collapsed && <ThemeSwitcher />}
        {!collapsed && (
          <div className="text-center text-xs text-brand-text-secondary pt-4">
              <p>&copy; theccndaily 2026</p>
          </div>
        )}
      </div>
    </aside>
  );
};

const BackButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-sm font-semibold text-brand-text-primary hover:border-brand-accent transition-colors ${className}`}
    >
      <ChevronLeft className="h-4 w-4" /> Back
    </button>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentTrack, isDetailedPlayerOpen } = useAudioPlayer();
  const alerts = useSentinel();
  const { unreadCount } = useNotifications();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const isPublicRoute =
    ['/', '/blog', '/newsletter', '/podcasts', '/pricing', '/give', '/onboarding', '/join'].includes(location.pathname) ||
    location.pathname.startsWith('/blog/');

  if (isPublicRoute) {
    const showBack = location.pathname !== '/';
    return (
      <>
        {showBack && (
          <div className="fixed top-4 left-4 z-50">
            <BackButton />
          </div>
        )}
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
      <Sidebar className="hidden md:flex" collapsible />

      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-brand-border bg-brand-dark px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex items-center gap-2 border border-brand-border px-3 py-2 text-sm font-semibold text-brand-text-primary"
          >
            <Menu className="h-5 w-5" /> Menu
          </button>
          <BackButton className="!px-2.5" />
        </div>
        <NavLink to="/inbox" className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
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
          <div className="absolute inset-y-0 left-0 w-72 max-w-[82vw] glass-panel">
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
          <div className="mb-4 hidden items-center justify-between md:flex">
            <BackButton />
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
                    <Activity className="w-4 h-4 mr-2"/> Sentinel Alert: System recommendations are ready for operational review.
                  </p>
                  <NavLink to="/studio/diagnostics" className="text-[12px] underline text-brand-accent font-bold">VIEW</NavLink>
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
