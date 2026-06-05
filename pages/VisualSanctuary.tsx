import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../components/Card';
import { Download, Moon, Pause, Play, Sparkles, Sunrise, Waves } from 'lucide-react';

const themes = [
  {
    id: 'dawn',
    name: 'Dawn',
    icon: Sunrise,
    prompt: 'A quiet hillside at dawn with warm light, still air, and space to breathe.',
    palette: ['#30120B', '#8E1B1B', '#F27D26', '#FFD08A'],
    prayer: 'Lord, let the morning teach my heart to begin again with You.',
  },
  {
    id: 'still-water',
    name: 'Still Water',
    icon: Waves,
    prompt: 'A peaceful lake at blue hour with soft ripples and a gentle horizon.',
    palette: ['#071113', '#12343B', '#2E7780', '#BDE7DF'],
    prayer: 'Lead me beside still waters and restore what has been scattered in me.',
  },
  {
    id: 'night-watch',
    name: 'Night Watch',
    icon: Moon,
    prompt: 'A quiet night sky over a chapel garden with candlelight and deep rest.',
    palette: ['#08070A', '#1C1727', '#5E3C72', '#F1C27D'],
    prayer: 'Keep watch with me, Lord, and settle my soul in Your peace.',
  },
];

const hashPrompt = (value: string) => Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);

const VisualSanctuary: React.FC = () => {
  const [prompt, setPrompt] = useState(themes[0].prompt);
  const [themeId, setThemeId] = useState(themes[0].id);
  const [isBreathing, setIsBreathing] = useState(true);
  const [minutes, setMinutes] = useState(5);
  const activeTheme = themes.find(theme => theme.id === themeId) || themes[0];

  const scene = useMemo(() => {
    const seed = hashPrompt(prompt + themeId);
    const offset = seed % 32;
    const [deep, mid, ember, light] = activeTheme.palette;
    return {
      background: `
        radial-gradient(circle at ${28 + offset}% ${24 + (offset % 12)}%, ${light}55 0, transparent 18rem),
        radial-gradient(circle at ${70 - (offset % 20)}% 66%, ${ember}44 0, transparent 22rem),
        linear-gradient(150deg, ${deep} 0%, ${mid} 48%, ${ember} 100%)
      `,
      light,
      ember,
    };
  }, [activeTheme, prompt, themeId]);

  const downloadSanctuary = () => {
    const text = [
      'THE CCN DAILY - Visual Sanctuary',
      '',
      `Theme: ${activeTheme.name}`,
      `Prayer time: ${minutes} minutes`,
      `Prompt: ${prompt}`,
      '',
      activeTheme.prayer,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ccn-daily-visual-sanctuary.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col pb-10">
      <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-accent">Pray</p>
        <h1 className="mb-2 text-4xl font-black text-brand-text-primary" style={{ fontFamily: 'var(--serif-display)' }}>Visual Sanctuary</h1>
        <p className="text-brand-text-secondary">An interactive prayer atmosphere with breathing rhythm, devotional focus, and downloadable reflection.</p>
      </motion.div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="space-y-6 lg:col-span-1">
          <div>
            <h2 className="mb-3 text-lg font-bold text-brand-text-primary">Design Space</h2>
            <p className="mb-4 text-xs leading-relaxed text-brand-text-secondary">Choose an atmosphere or write your own. The sanctuary updates immediately.</p>
            <textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              className="h-32 w-full rounded-xl border border-brand-border bg-brand-secondary p-3 text-sm text-brand-text-primary outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {themes.map(theme => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setThemeId(theme.id);
                    setPrompt(theme.prompt);
                  }}
                  className={`rounded-xl border px-3 py-3 text-xs font-bold transition-colors ${themeId === theme.id ? 'border-brand-accent bg-brand-accent text-white' : 'border-brand-border bg-brand-secondary text-brand-text-secondary'}`}
                >
                  <Icon className="mx-auto mb-1 h-4 w-4" />
                  {theme.name}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-brand-text-secondary">Prayer minutes</span>
            <input type="range" min="2" max="20" value={minutes} onChange={event => setMinutes(Number(event.target.value))} className="w-full accent-brand-accent" />
            <span className="mt-1 block text-sm font-bold text-brand-text-primary">{minutes} minutes</span>
          </label>

          <div className="flex gap-2">
            <button onClick={() => setIsBreathing(value => !value)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 text-sm font-bold text-white">
              {isBreathing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isBreathing ? 'Pause' : 'Begin'}
            </button>
            <button onClick={downloadSanctuary} className="rounded-xl border border-brand-border bg-brand-secondary px-4 py-3 text-brand-text-primary" aria-label="Download sanctuary reflection">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </Card>

        <Card className="relative min-h-[32rem] overflow-hidden border-none p-0 lg:col-span-3">
          <div className="absolute inset-0" style={{ background: scene.background }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.34)_72%)]" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, ${scene.light}cc 0%, ${scene.ember}55 42%, transparent 70%)` }}
            animate={isBreathing ? { scale: [1, 1.28, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 0.8 }}
            transition={{ duration: 6, repeat: isBreathing ? Infinity : 0, ease: 'easeInOut' }}
          />
          <div className="absolute inset-x-8 bottom-8 z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              {activeTheme.name} sanctuary
            </div>
            <h2 className="mb-3 text-3xl font-semibold leading-tight text-white" style={{ fontFamily: 'var(--serif-display)' }}>{activeTheme.prayer}</h2>
            <p className="max-w-xl text-sm leading-relaxed text-white/80">{prompt}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VisualSanctuary;
