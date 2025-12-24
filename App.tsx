
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
import PrayerWall from './pages/PrayerWall';
import TestimoniesPage from './pages/TestimoniesPage';
import GamificationPage from './pages/GamificationPage';
import GiftingPage from './pages/GiftingPage';
import { GamificationProvider } from './contexts/GamificationContext';
import AdminDashboard from './pages/AdminDashboard';
import DynamicTheming from './pages/DynamicTheming';
import AtmosphericMusicPage from './pages/AtmosphericMusicPage';
import BibleReaderPage from './pages/BibleReaderPage';
import { AuthProvider } from './contexts/AuthContext';
import GuidedJourneyPage from './pages/GuidedJourneyPage';
import QuoteGeneratorPage from './pages/QuoteGeneratorPage';
import VisionaryLab from './pages/VisionaryLab';
import RoadmapEvolution from './pages/RoadmapEvolution';
import VoiceCompanion from './pages/VoiceCompanion';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GamificationProvider>
          <AudioPlayerProvider>
            <HashRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/plan" replace />} />
                  <Route path="/plan" element={<MasterPlan />} />
                  <Route path="/roadmap-evolution" element={<RoadmapEvolution />} />
                  <Route path="/sentient-guide" element={<VoiceCompanion />} />
                  <Route path="/visionary-lab" element={<VisionaryLab />} />
                  <Route path="/guided-journey" element={<GuidedJourneyPage />} />
                  <Route path="/data" element={<DataArchitecture />} />
                  <Route path="/roles" element={<Roles />} />
                  <Route path="/reader-prototype" element={<ReaderPrototype />} />
                  <Route path="/bible" element={<BibleReaderPage />} />
                  <Route path="/podcasts" element={<PodcastPage />} />
                  <Route path="/devotional-generator" element={<DevotionalGeneratorPage />} />
                  <Route path="/quote-generator" element={<QuoteGeneratorPage />} />
                  <Route path="/prayer-wall" element={<PrayerWall />} />
                  <Route path="/testimonies" element={<TestimoniesPage />} />
                  <Route path="/gamification" element={<GamificationPage />} />
                  <Route path="/gifting" element={<GiftingPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/dynamic-theming" element={<DynamicTheming />} />
                  <Route path="/atmospheric-music" element={<AtmosphericMusicPage />} />
                  <Route path="/media-plan" element={<MediaPlayerPlan />} />
                  <Route path="/design-system" element={<DesignSystem />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/next-steps" element={<NextSteps />} />
                  <Route path="/chat" element={<ChatWithTeam />} />
                </Routes>
              </Layout>
            </HashRouter>
          </AudioPlayerProvider>
        </GamificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
