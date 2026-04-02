
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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

import ErrorBoundary from './components/ErrorBoundary';

import RequireAuth from './components/auth/RequireAuth';
import RequireRole from './components/auth/RequireRole';

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
                    <UpgradeModalProvider>
                      <Layout>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<Navigate to="/app/guided-journey" replace />} />
                          <Route path="/pricing" element={<PricingPage />} />
                          
                          {/* Member Sanctuary Routes */}
                          <Route path="/app/*">
                            <Route index element={<Navigate to="guided-journey" replace />} />
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
                            <Route path="events" element={<RequireAuth><EventsPage /></RequireAuth>} />
                            <Route path="live" element={<RequireAuth><LiveStreamPage /></RequireAuth>} />
                            <Route path="giving" element={<RequireAuth><GivingPage /></RequireAuth>} />
                          </Route>

                          {/* Founder Command Center Routes (Admin Only) */}
                          <Route path="/studio/*">
                            <Route index element={<Navigate to="admin" replace />} />
                            <Route path="admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
                            <Route path="plan" element={<RequireRole role="admin"><MasterPlan /></RequireRole>} />
                            <Route path="roadmap-evolution" element={<RequireRole role="admin"><RoadmapEvolution /></RequireRole>} />
                            <Route path="visionary-lab" element={<RequireRole role="admin"><VisionaryLab /></RequireRole>} />
                            <Route path="data" element={<RequireRole role="admin"><DataArchitecture /></RequireRole>} />
                            <Route path="roles" element={<RequireRole role="admin"><Roles /></RequireRole>} />
                            <Route path="multi-tenancy" element={<RequireRole role="admin"><MultiTenancyAdmin /></RequireRole>} />
                            <Route path="devotional-generator" element={<RequireRole role="admin"><DevotionalGeneratorPage /></RequireRole>} />
                            <Route path="quote-generator" element={<RequireRole role="admin"><QuoteGeneratorPage /></RequireRole>} />
                            <Route path="dynamic-theming" element={<RequireRole role="admin"><DynamicTheming /></RequireRole>} />
                            <Route path="atmospheric-music" element={<RequireRole role="admin"><AtmosphericMusicPage /></RequireRole>} />
                            <Route path="media-plan" element={<RequireRole role="admin"><MediaPlayerPlan /></RequireRole>} />
                            <Route path="design-system" element={<RequireRole role="admin"><DesignSystem /></RequireRole>} />
                            <Route path="diagnostics" element={<RequireRole role="admin"><DiagnosticsPage /></RequireRole>} />
                            <Route path="growth" element={<RequireRole role="admin"><GrowthConsole /></RequireRole>} />
                            <Route path="release-ops" element={<RequireRole role="admin"><ReleaseOpsConsole /></RequireRole>} />
                            <Route path="team" element={<RequireRole role="admin"><Team /></RequireRole>} />
                            <Route path="next-steps" element={<RequireRole role="admin"><NextSteps /></RequireRole>} />
                            <Route path="chat" element={<RequireRole role="admin"><ChatWithTeam /></RequireRole>} />
                          </Route>

                          {/* Catch-all */}
                          <Route path="*" element={<Navigate to="/app/guided-journey" replace />} />
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
