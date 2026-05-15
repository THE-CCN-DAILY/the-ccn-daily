import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PenLine } from 'lucide-react';

const posts = [
  {
    title: 'Faith that can survive Monday morning',
    category: 'Work and devotion',
    excerpt:
      'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul.',
  },
  {
    title: 'Why quiet is not weakness',
    category: 'Spiritual formation',
    excerpt:
      'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise.',
  },
  {
    title: 'A better rhythm for Christian professionals',
    category: 'Leadership',
    excerpt:
      'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure.',
  },
];

const BlogPage: React.FC = () => (
  <div className="min-h-screen bg-brand-secondary text-brand-text-primary">
    <header className="border-b border-brand-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-xl font-bold">THE CCN DAILY</Link>
        <Link to="/app/guided-journey" className="border border-brand-border px-4 py-2 text-sm font-semibold hover:bg-brand-dark">
          Enter app
        </Link>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-16 max-w-3xl">
        <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
          <PenLine className="h-4 w-4" /> Blog
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight">
          Essays for faith, work, leadership, endurance, and the inner life.
        </h1>
      </div>
      <div className="divide-y divide-brand-border border-y border-brand-border">
        {posts.map((post) => (
          <article key={post.title} className="grid gap-8 py-10 md:grid-cols-[0.35fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-text-secondary">
                {post.category}
              </p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight">{post.title}</h2>
              <p className="mt-5 max-w-2xl text-[17px] leading-[1.8] text-brand-text-secondary">
                {post.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
                <BookOpen className="h-4 w-4" /> Admin publishing comes next in the studio
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  </div>
);

export default BlogPage;
