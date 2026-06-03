
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BlogStudioPage from './pages/BlogStudioPage';
import MasterPlan from './pages/MasterPlan';
import Team from './pages/Team';
import NextSteps from './pages/NextSteps';
import ChatWithTeam from './pages/ChatWithTeam';
import DataArchitecture from './pages/DataArchitecture';
import Roles from './pages/Roles';
import { ThemeProvider } from './contexts/ThemeContext';
import ReaderPrototype from './pages/ReaderPrototype';
import PodcastPage from './pages/PodcastPage';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import MediaPlayerPlan from './pages/MediaPlayerPlan';
import DesignSystem from './pages/DesignSystem';
import DevotionalGeneratorPage from './pages/DevotionalGeneratorPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import TheCommunity from './pages/TheCommunity';
import TestimoniesPage from './pages/TestimoniesPage';
import GamificationPage from './pages/GamificationPage';
import GraceLinkPage from './pages/GraceLinkPage';
import { GamificationProvider } from './contexts/GamificationContext';
import { RoadmapProvider } from './contexts/RoadmapContext';
import AdminDashboard from './pages/AdminDashboard';
import DynamicTheming from './pages/DynamicTheming';
import AtmosphericMusicPage from './pages/AtmosphericMusicPage';
import BibleReaderPage from './pages/BibleReaderPage';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UpgradeModalProvider } from './contexts/UpgradeModalContext';
import GuidedJourneyPage from './pages/GuidedJourneyPage';
import QuoteGeneratorPage from './pages/QuoteGeneratorPage';
import VisionaryLab from './pages/VisionaryLab';
import RoadmapEvolution from './pages/RoadmapEvolution';
import VoiceCompanion from './pages/VoiceCompanion';
import VisualSanctuary from './pages/VisualSanctuary';
import InboxPage from './pages/InboxPage';
import EventsPage from './pages/EventsPage';
import GivingPage from './pages/GivingPage';
import PricingPage from './pages/PricingPage';
import ExpertCouncilPage from './pages/ExpertCouncilPage';
import MultiTenancyAdmin from './pages/MultiTenancyAdmin';
import LiveStreamPage from './pages/LiveStreamPage';
import GrowthConsole from './pages/GrowthConsole';
import ReleaseOpsConsole from './pages/ReleaseOpsConsole';
import CoursesPage from './pages/CoursesPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import AudiobookLibraryPage from './pages/AudiobookLibraryPage';
import ChallengesPage from './pages/ChallengesPage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';
import ChallengeModuleViewerPage from './pages/ChallengeModuleViewerPage';
import JournalingPage from './pages/JournalingPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import CommunityRoomsPage from './pages/CommunityRoomsPage';
import DashboardPage from './pages/DashboardPage';
import FamilyDashboardPage from './pages/FamilyDashboardPage';
import LeaderDashboardPage from './pages/LeaderDashboardPage';

import ContentManagerPage from './pages/ContentManagerPage';
import CommentModerationPage from './pages/CommentModerationPage';
import AnnouncementsManagerPage from './pages/AnnouncementsManagerPage';
import ChallengeModuleManagerPage from './pages/ChallengeModuleManagerPage';
import CourseModuleManagerPage from './pages/CourseModuleManagerPage';
import BooksLibraryPage from './pages/BooksLibraryPage';
import BookReaderPage from './pages/BookReaderPage';
import ReadingPlansPage from './pages/ReadingPlansPage';

import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import SignInModal from './components/auth/SignInModal';

import RequireAuth from './components/auth/RequireAuth';
import RequireRole from './components/auth/RequireRole';
import PrayerCirclePage from './pages/PrayerCirclePage';

import NewsletterPage from './pages/NewsletterPage';
import HelpPage from './pages/HelpPage';
import OnboardingPage from './pages/OnboardingPage';
import DonationPage from './pages/DonationPage';
import StudentVerificationPage from './pages/StudentVerificationPage';
import PlannerPage from './pages/PlannerPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <GamificationProvider>
              <RoadmapProvider>
                <AudioPlayerProvider>
                  <HashRouter>
                    <ScrollToTop />
                    <UpgradeModalProvider>
                      <Layout>
                        <SignInModal />
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/blog/:slug" element={<BlogPostPage />} />
                          <Route path="/newsletter" element={<NewsletterPage />} />
                          <Route path="/podcasts" element={<PodcastPage />} />
                          <Route path="/pricing" element={<PricingPage />} />
                          <Route path="/give" element={<DonationPage />} />
                          <Route path="/onboarding" element={<OnboardingPage />} />
                          
                          {/* Member Sanctuary Routes */}
                          <Route path="/app/*">
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                            <Route path="guided-journey" element={<RequireAuth><GuidedJourneyPage /></RequireAuth>} />
                            <Route path="bible" element={<RequireAuth><BibleReaderPage /></RequireAuth>} />
                            <Route path="podcasts" element={<RequireAuth><PodcastPage /></RequireAuth>} />
                            <Route path="the-community" element={<RequireAuth><TheCommunity /></RequireAuth>} />
                            <Route path="expert-council" element={<RequireAuth><ExpertCouncilPage /></RequireAuth>} />
                            <Route path="testimonies" element={<RequireAuth><TestimoniesPage /></RequireAuth>} />
                            <Route path="gamification" element={<RequireAuth><GamificationPage /></RequireAuth>} />
                            <Route path="grace-link" element={<RequireAuth><GraceLinkPage /></RequireAuth>} />
                            <Route path="sentient-guide" element={<RequireAuth><VoiceCompanion /></RequireAuth>} />
                            <Route path="visual-sanctuary" element={<RequireAuth><VisualSanctuary /></RequireAuth>} />
                            <Route path="inbox" element={<RequireAuth><InboxPage /></RequireAuth>} />
                            <Route path="newsletters" element={<RequireAuth><NewsletterPage /></RequireAuth>} />
                            <Route path="events" element={<RequireAuth><EventsPage /></RequireAuth>} />
                            <Route path="live" element={<RequireAuth><LiveStreamPage /></RequireAuth>} />
                            <Route path="giving" element={<RequireAuth><GivingPage /></RequireAuth>} />
                            <Route path="help" element={<HelpPage />} />
                            <Route path="student-verify" element={<RequireAuth><StudentVerificationPage /></RequireAuth>} />
                            <Route path="courses" element={<RequireAuth><CoursesPage /></RequireAuth>} />
                            <Route path="courses/:courseId" element={<RequireAuth><CoursePlayerPage /></RequireAuth>} />
                            <Route path="audiobook-library" element={<RequireAuth><AudiobookLibraryPage /></RequireAuth>} />
                            <Route path="challenges" element={<RequireAuth><ChallengesPage /></RequireAuth>} />
                            <Route path="challenges/:challengeId" element={<RequireAuth><ChallengeDetailPage /></RequireAuth>} />
                            <Route path="challenges/:challengeId/modules/:moduleId" element={<RequireAuth><ChallengeModuleViewerPage /></RequireAuth>} />
                            <Route path="books" element={<RequireAuth><BooksLibraryPage /></RequireAuth>} />
                            <Route path="book/:bookId" element={<RequireAuth><BookReaderPage /></RequireAuth>} />
                            <Route path="reading-plans" element={<RequireAuth><ReadingPlansPage /></RequireAuth>} />
                            <Route path="reading-plans/:planId" element={<RequireAuth><ReadingPlansPage /></RequireAuth>} />
                            <Route path="journaling" element={<RequireAuth><JournalingPage /></RequireAuth>} />
                            <Route path="library" element={<RequireAuth><LibraryPage /></RequireAuth>} />
                            <Route path="settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                            <Route path="planner" element={<RequireAuth><PlannerPage /></RequireAuth>} />
                            <Route path="community-rooms" element={<RequireAuth><CommunityRoomsPage /></RequireAuth>} />
                            <Route path="prayer-circle" element={<RequireAuth><PrayerCirclePage /></RequireAuth>} />
                            <Route path="family-dashboard" element={<RequireRole allowedRoles={['admin', 'family_lead']}><FamilyDashboardPage /></RequireRole>} />
                            <Route path="leader-dashboard" element={<RequireRole allowedRoles={['admin', 'group_lead']}><LeaderDashboardPage /></RequireRole>} />
                          </Route>

                          {/* Founder Command Center Routes (Admin Only) */}
                          <Route path="/studio/*">
                            <Route index element={<Navigate to="admin" replace />} />
                            <Route path="admin" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />
                            <Route path="blog" element={<RequireRole allowedRoles={['admin']}><BlogStudioPage /></RequireRole>} />
                            <Route path="plan" element={<RequireRole allowedRoles={['admin']}><MasterPlan /></RequireRole>} />
                            <Route path="roadmap-evolution" element={<RequireRole allowedRoles={['admin']}><RoadmapEvolution /></RequireRole>} />
                            <Route path="visionary-lab" element={<RequireRole allowedRoles={['admin']}><VisionaryLab /></RequireRole>} />
                            <Route path="data" element={<RequireRole allowedRoles={['admin']}><DataArchitecture /></RequireRole>} />
                            <Route path="roles" element={<RequireRole allowedRoles={['admin']}><Roles /></RequireRole>} />
                            <Route path="multi-tenancy" element={<RequireRole allowedRoles={['admin']}><MultiTenancyAdmin /></RequireRole>} />
                            <Route path="devotional-generator" element={<RequireRole allowedRoles={['admin']}><DevotionalGeneratorPage /></RequireRole>} />
                            <Route path="quote-generator" element={<RequireRole allowedRoles={['admin']}><QuoteGeneratorPage /></RequireRole>} />
                            <Route path="dynamic-theming" element={<RequireRole allowedRoles={['admin']}><DynamicTheming /></RequireRole>} />
                            <Route path="atmospheric-music" element={<RequireRole allowedRoles={['admin']}><AtmosphericMusicPage /></RequireRole>} />
                            <Route path="media-plan" element={<RequireRole allowedRoles={['admin']}><MediaPlayerPlan /></RequireRole>} />
                            <Route path="design-system" element={<RequireRole allowedRoles={['admin']}><DesignSystem /></RequireRole>} />
                            <Route path="diagnostics" element={<RequireRole allowedRoles={['admin']}><DiagnosticsPage /></RequireRole>} />
                            <Route path="content-manager" element={<RequireRole allowedRoles={['admin', 'lead_developer']}><ContentManagerPage /></RequireRole>} />
                            <Route path="comments" element={<RequireRole allowedRoles={['admin']}><CommentModerationPage /></RequireRole>} />
                            <Route path="announcements" element={<RequireRole allowedRoles={['admin']}><AnnouncementsManagerPage /></RequireRole>} />
                            <Route path="challenges/:challengeId/modules" element={<RequireRole allowedRoles={['admin', 'lead_developer']}><ChallengeModuleManagerPage /></RequireRole>} />
                            <Route path="courses/:courseId/modules" element={<RequireRole allowedRoles={['admin', 'lead_developer']}><CourseModuleManagerPage /></RequireRole>} />
                            <Route path="growth" element={<RequireRole allowedRoles={['admin']}><GrowthConsole /></RequireRole>} />
                            <Route path="release-ops" element={<RequireRole allowedRoles={['admin', 'lead_developer']}><ReleaseOpsConsole /></RequireRole>} />
                            <Route path="team" element={<RequireRole allowedRoles={['admin']}><Team /></RequireRole>} />
                            <Route path="next-steps" element={<RequireRole allowedRoles={['admin']}><NextSteps /></RequireRole>} />
                            <Route path="chat" element={<RequireRole allowedRoles={['admin']}><ChatWithTeam /></RequireRole>} />
                          </Route>

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Layout>
                    </UpgradeModalProvider>
                  </HashRouter>
                </AudioPlayerProvider>
              </RoadmapProvider>
            </GamificationProvider>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
