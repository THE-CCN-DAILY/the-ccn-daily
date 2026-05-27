
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateCloudflareText } from '../services/geminiService';
import { CloseIcon, SendIcon } from './icons';

interface ScriptureStudyCompanionProps {
  passage: string;
  passageText: string;
  isOpen: boolean;
  onClose: () => void;
}

interface QAPair {
  question: string;
  response: string;
}

const ScriptureStudyCompanion: React.FC<ScriptureStudyCompanionProps> = ({
  passage,
  passageText,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<QAPair | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const systemInstruction = `You are a pastoral study companion for THE CCN DAILY devotional app.
The user is studying ${passage}: "${passageText}"

RULES:
1. Every answer must reference this specific passage — never answer in the abstract
2. Use Scripture to interpret Scripture — cite other relevant verses when helpful
3. Pastoral tone: warm, direct, faithful — not academic or therapeutic
4. If asked something unrelated to this passage, gently redirect: "Let's stay with what ${passage} says..."
5. Keep responses to 150 words maximum
6. End each response with one reflection question for the reader
7. Never use phrases like "certainly", "absolutely", "great question"`;

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setCurrentAnswer(null);

    try {
      const response = await generateCloudflareText({
        feature: 'coach',
        prompt: q,
        systemInstruction,
        model: '@cf/meta/llama-3.1-8b-instruct',
        userId: user?.uid ?? 'anonymous',
        units: 400,
      });

      const pair: QAPair = { question: q, response };
      setCurrentAnswer(pair);

      // Save to Firestore if user is authenticated
      if (user?.uid) {
        await addDoc(collection(db, 'users', user.uid, 'study_sessions'), {
          passage,
          question: q,
          response,
          timestamp: serverTimestamp(),
        });
      }

      setQuestion('');
    } catch {
      setCurrentAnswer({
        question: q,
        response: `The passage ${passage} is worth sitting with. Try rephrasing your question, or ask about a specific word or phrase in the text.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Slide-up panel */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col"
            style={{ maxHeight: '80vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          >
            <div
              className="flex flex-col overflow-hidden rounded-t-3xl border-t border-x border-brand-border"
              style={{ background: 'var(--bg-card, #FBF6EA)', maxHeight: '80vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-brand-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border flex-shrink-0">
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'var(--crimson, #8E1B1B)',
                      marginBottom: '2px',
                    }}
                  >
                    Scripture Study
                  </p>
                  <h3
                    style={{
                      fontFamily: 'var(--serif-display, "Cormorant Garamond", "Didot", Georgia, serif)',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: 'var(--fg-1, #2A1C15)',
                    }}
                  >
                    {passage}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-secondary transition-all"
                  aria-label="Close study companion"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Passage text preview */}
                {passageText && (
                  <div
                    className="mb-5 p-4 rounded-xl border border-brand-border"
                    style={{ background: 'var(--bg-paper, #F6EFE1)' }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                        fontStyle: 'italic',
                        fontSize: '16px',
                        lineHeight: 1.7,
                        color: 'var(--fg-1, #2A1C15)',
                      }}
                    >
                      {passageText}
                    </p>
                    <p
                      className="mt-2"
                      style={{
                        fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--crimson, #8E1B1B)',
                      }}
                    >
                      {passage}
                    </p>
                  </div>
                )}

                {/* Answer area */}
                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 py-6"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-brand-accent"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                          fontStyle: 'italic',
                          fontSize: '15px',
                          color: 'var(--fg-2, #5B4A3C)',
                        }}
                      >
                        Searching the text...
                      </p>
                    </motion.div>
                  )}

                  {currentAnswer && !isLoading && (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      {/* Question echo */}
                      <div className="mb-3 flex justify-end">
                        <div
                          className="max-w-[80%] px-4 py-2 rounded-2xl rounded-tr-sm"
                          style={{ background: 'var(--crimson, #8E1B1B)' }}
                        >
                          <p
                            style={{
                              fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                              fontSize: '14px',
                              color: '#fff',
                            }}
                          >
                            {currentAnswer.question}
                          </p>
                        </div>
                      </div>

                      {/* Response */}
                      <div
                        className="p-4 rounded-2xl rounded-tl-sm border border-brand-border mb-4"
                        style={{ background: 'var(--bg-paper, #F6EFE1)' }}
                      >
                        <p
                          style={{
                            fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                            fontSize: '17px',
                            lineHeight: 1.75,
                            color: 'var(--fg-1, #2A1C15)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {currentAnswer.response}
                        </p>
                        <p
                          className="mt-3"
                          style={{
                            fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--crimson, #8E1B1B)',
                          }}
                        >
                          {passage}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && !currentAnswer && (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-4 text-center"
                    >
                      <p
                        style={{
                          fontFamily: 'var(--serif-body, "EB Garamond", "Garamond", Georgia, serif)',
                          fontStyle: 'italic',
                          fontSize: '16px',
                          color: 'var(--fg-2, #5B4A3C)',
                          lineHeight: 1.6,
                        }}
                      >
                        Ask anything about this passage. What word catches your attention?
                        What question does this text raise for you?
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input area — fixed at bottom */}
              <div className="px-6 py-4 border-t border-brand-border flex-shrink-0" style={{ background: 'var(--bg-card, #FBF6EA)' }}>
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask about ${passage}...`}
                    disabled={isLoading}
                    className="flex-1 bg-brand-secondary border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:border-brand-accent transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)' }}
                  />
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!question.trim() || isLoading}
                    className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Explore this question"
                  >
                    <SendIcon className="w-4 h-4" />
                  </motion.button>
                </div>
                <p
                  className="mt-2 text-center"
                  style={{
                    fontFamily: 'var(--sans-ui, "Inter Tight", -apple-system, sans-serif)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    color: 'var(--fg-2, #5B4A3C)',
                    opacity: 0.6,
                  }}
                >
                  Answers are anchored in {passage}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScriptureStudyCompanion;
