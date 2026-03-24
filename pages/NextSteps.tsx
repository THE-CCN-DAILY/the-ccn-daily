import React from 'react';
import Card from '../components/Card';
import type { NextStepItem } from '../types';
import { StepsIcon } from '../components/icons';

const nextStepsData: NextStepItem[] = [
  { id: 'step0', text: 'Approve the revised Master Plan to greenlight Phase 0.', isCompleted: true },
  { id: 'step1', text: "Review the initial UI/UX implementation in the 'Design System' prototype and provide feedback.", isCompleted: true },
  { id: 'step2', text: 'Review the new modular reader architecture and provide feedback on the ePub prototype.', isCompleted: true },
  { id: 'step3', text: 'Finalize and approve the Kindle-like themes in the Reader Prototype.', isCompleted: true },
  { id: 'step4', text: 'Review the custom fonts and text sizing controls now active in the Reader Prototype.', isCompleted: true },
  { id: 'step5', text: 'Review the proposed feature set for the Immersive Media Player and provide feedback on priorities.', isCompleted: true },
  { id: 'step6', text: 'Review the new Synchronized Transcript feature in the media player and provide feedback.', isCompleted: true },
  { id: 'step7', text: 'Review the new Chapter Markers feature in the media player to improve navigation.', isCompleted: true },
  { id: 'step8', text: 'Review the new playback controls (speed & sleep timer) in the detailed player\'s options menu.', isCompleted: true },
  { id: 'step9', text: "Review the new AI-Generated Summaries, now visible in the detailed player's default 'Summary' tab.", isCompleted: true },
  { id: 'step10', text: 'Review the new AI-Powered Thematic Search feature, which allows searching within episode transcripts.', isCompleted: true },
  { id: 'step11', text: "Review the new AI-Powered Note Tagging and Filtering in the Reader Prototype's 'Smart Library'.", isCompleted: true },
  { id: 'step12', text: "Review the AI Coach's new long-term memory feature, enabling more contextual conversations.", isCompleted: true },
  { id: 'step13', text: 'Review the new Personalized Devotional Generator, which uses personal context to create tailored content.', isCompleted: true },
  { id: 'step14', text: "Review and approve the new AI writing instructions (the 'Founder's Voice') now powering the devotional generator.", isCompleted: true },
  { id: 'step15', text: 'Review the updated devotional structure, which now includes a "For Further Study" section.', isCompleted: true },
  { id: 'step16', text: 'Review the unified reader features (highlights, notes) and new Text-to-Speech functionality on the Devotional page.', isCompleted: true },
  { id: 'step17', text: "Review the devotional's daily generation limit, automatic saving, and new 'copy with formatting' feature.", isCompleted: true },
  { id: 'step18', text: 'Review the fix for the Web Share API, which now reliably shares content or falls back to copying the text if sharing fails.', isCompleted: true },
  { id: 'step19', text: "Verify the definitive fix for all Share and Copy functions. These actions should now work reliably without 'Invalid URL' or 'Permission Denied' errors.", isCompleted: true },
  { id: 'step20', text: 'Verify the definitive fix for text highlighting and selection copying. Both features should now work reliably across the Reader and Devotional pages.', isCompleted: true },
  { id: 'step21', text: 'Verify the fix for the Share button to ensure it copies on desktop and uses the native share UI on mobile.', isCompleted: true },
  { id: 'step22', text: 'Verify the definitive fix for the text highlighting system on the Devotional page. It should now work reliably.', isCompleted: true },
  { id: 'step23', text: 'Verify the re-engineered highlighting system. The old method failed on formatted text; this new version should be robust across all content.', isCompleted: true },
  { id: 'step24', text: 'Review the Prayer Wall prototype, including the new feature to add a testimony to an answered prayer.', isCompleted: true },
  { id: 'step25', text: 'Review the enhanced Testimonies page, which now supports both answered prayers and standalone stories of faith.', isCompleted: true },
  { id: 'step26', text: 'Review the new user comments feature in the detailed podcast player.', isCompleted: true },
  { id: 'step27', text: 'Review the unified user comments feature, now available in the Reader Prototype.', isCompleted: true },
  { id: 'step28', text: 'Review the new Gamification prototype, including the daily streak and points system.', isCompleted: true },
  { id: 'step29', text: 'Review the new Rewards Store prototype, where users can spend their earned points.', isCompleted: true },
  { id: 'step30', text: "Review the new 'How to Earn' guide, which details how users can accumulate points through app engagement.", isCompleted: true },
  { id: 'step31', text: "Approve the revised Master Plan, which now incorporates your full vision for the app's future.", isCompleted: true },
  { id: 'step32', text: 'Review the now-functional Gamification Engine. Actions in the app will now award points and unlock achievements in real-time.', isCompleted: true },
  { id: 'step35', text: 'Review the unified Text-to-Speech (Read Aloud) feature, now functional in the Reader Prototype.', isCompleted: true },
  { id: 'step36', text: 'Review the unified premium reader experience, now active on the Devotional page. It now has themes, font controls, and the Smart Library.', isCompleted: true },
  { id: 'step37', text: "Review the new 'un-highlight' feature. Click any highlight in the Reader or Devotional page to bring up a 'Remove' option.", isCompleted: true },
  { id: 'step38', text: 'Review the new Gifting prototype. This feature allows users to purchase and send content like courses or books as gifts to others.', isCompleted: true },
  { id: 'step39', text: "Verify the completely re-architected highlighting system. This definitive fix resolves all previous bugs. Please confirm that all colors work and can be removed reliably on BOTH the Reader Prototype and the Devotional Generator pages.", isCompleted: true },
  { id: 'step40', text: 'Review the new Admin Dashboard prototype for managing users and content.', isCompleted: true },
  { id: 'step41', text: "Review the Dynamic Theming Engine prototype. Observe how selecting a 'mood' changes the app's background aurora.", isCompleted: true },
  { id: 'step42', text: "Review the email service integration on the Gifting page. Sending a gift should now show a loading state and a success message.", isCompleted: true },
  { id: 'step43', text: 'Review and approve the updated Master Plan, which now includes proposals for Atmospheric AI Music (Lyria) and Premium AI Narration (TTS).', isCompleted: true },
  { id: 'step44', text: "Review the new Premium AI Narration. In the Reader, go to Settings -> Narrator Voice, choose a voice, and test the 'Read Aloud' feature.", isCompleted: true },
  { id: 'step45', text: "Review the fixes and UX improvements for AI Narration. The correct audio now plays, voices are distinct, and a quick-access voice selector has been added to the reader toolbar.", isCompleted: true },
  { id: 'step46', text: "Verify the definitive fix for AI Narration: confirm audio plays without error and the voice selector is now a quick-access popover on the toolbar (removed from Settings).", isCompleted: true },
  { id: 'step47', text: "Verify the AI Narration feature now provides audible feedback. Clicking 'Read Aloud' should play a short beep sound, confirming the audio system is working. Toggling the button should correctly play/pause this sound.", isCompleted: true },
  { id: 'step48', text: "Review the Atmospheric AI Music prototype. Select different 'moods' to hear the corresponding ambient music and test the playback controls.", isCompleted: true },
  { id: 'step49', text: "Verify the fix for all audio playback. The Atmospheric Music and Podcast Library features should now play audio without 'source not found' errors.", isCompleted: true },
  { id: 'step50', text: 'Review the new Bible Reader prototype. Test book/chapter navigation and verify that all reader features (highlights, notes, TTS) are functional.', isCompleted: true },
  { id: 'step51', text: 'Review the new Bible Search feature. Test searching for a word with different scopes (e.g., All, NT, OT, a specific book) and click a result to navigate.', isCompleted: true },
  { id: 'step52', text: 'Review the "Great Separation" navigation overhaul, which splits the app into Sanctuary and Command Center modes.', isCompleted: true },
  { id: 'step53', text: 'Review the new Grace Link prototype for frictionless spiritual gift sharing.', isCompleted: true },
  { id: 'step54', text: 'Review the Lumina Community Summarizer in The Community page.', isCompleted: true },
  { id: 'step55', text: 'Review the updated terminology across the app (e.g., "The Community", "Community Admin").', isCompleted: true },
  { id: 'step56', text: 'Review the Substack Devotional Sync feature. The Devotional Generator now uses the urlContext tool to fetch real themes from theccndaily.substack.com.', isCompleted: true },
  { id: 'step57', text: 'Review the updated "Visual Sanctuary" which now uses Veo 3.1 to generate cinematic video backgrounds.', isCompleted: true },
  { id: 'step58', text: 'Review the expanded Admin Dashboard, which now includes tabs for Broadcasts, Live Events, and Payments.', isCompleted: true },
  { id: 'step59', text: 'Review the enhanced "AI Course Studio" in the Admin Dashboard, designed to turn newsletters/books into interactive courses.', isCompleted: true },
  { id: 'step61', text: 'Review the new "Inbox & Updates" page in the Sanctuary, which receives simulated broadcasts from the Admin Dashboard.', isCompleted: true },
  { id: 'step62', text: 'Review the new "Live Events" page in the Sanctuary, featuring event registration and Grace Link sharing.', isCompleted: true },
  { id: 'step63', text: 'Review the new "Giving & Support" page in the Sanctuary, featuring simulated Stripe and Flutterwave payment flows.', isCompleted: true },
  { id: 'step60', text: "Greenlight the final 'Project Phoenix' Master Plan to begin production development.", isCompleted: true },
  { id: 'step33', text: 'Provide API keys for third-party services like Resend (when required).', isCompleted: false },
  { id: 'step34', text: 'Review and approve the proposed Firestore security rules (during implementation).', isCompleted: false },
];

const NextSteps: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Required Founder Actions</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        All interactive prototypes are complete. We are ready for your direction on the next phase of development.
      </p>
      <Card>
        <ul className="space-y-4">
          {nextStepsData.map((item) => (
            <li key={item.id} className={`flex items-start p-3 bg-brand-secondary/50 rounded-lg ${item.isCompleted ? 'opacity-50' : ''}`}>
                <StepsIcon className={`w-6 h-6 mr-4 mt-1 flex-shrink-0 ${item.isCompleted ? 'text-green-500' : 'text-brand-accent'}`}/>
                <span className={`text-lg ${item.isCompleted ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'}`}>{item.text}</span>
            </li>
          ))}
        </ul>
      </Card>
       <div className="mt-8 text-center text-brand-text-secondary">
        <p>The next items will become actionable as we implement the corresponding features.</p>
      </div>
    </div>
  );
};

export default NextSteps;