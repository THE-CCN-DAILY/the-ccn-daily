import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Card from '../Card';
import { SpinnerIcon } from '../icons';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface LandscapeData {
  totalUsers: number;
  newThisWeek: number;
  newThisMonth: number;
  tierDistribution: { free: number; pro: number; max: number; partner: number };
  totalDonors: number;
  totalRaised: number;
  avgGift: number;
  totalDonations: number;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function BarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-brand-text-primary">
        <span>{label}</span>
        <span className="text-brand-text-secondary">
          {value} <span className="font-normal opacity-60">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-brand-dark overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-dark p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-brand-text-primary">{value}</p>
      {sub && <p className="text-xs text-brand-text-secondary mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Static trend suggestions ────────────────────────────────────────────── */

const TREND_SUGGESTIONS = [
  {
    title: 'WhatsApp conversion is your biggest untapped channel',
    detail:
      'Your largest existing audience receives devotionals via WhatsApp but is not yet on the app. A direct in-devotional CTA — "Continue reading in the app" with a QR code — could convert 15–30% of active WhatsApp readers.',
    urgency: 'High',
    color: '#22c55e',
  },
  {
    title: 'Podcast listeners are a high-intent audience',
    detail:
      'Listeners who finish full episodes show the strongest engagement signal. An episode end-card ("Open this week\'s study guide in the app") creates a natural conversion path from audio to formed habit.',
    urgency: 'High',
    color: '#22c55e',
  },
  {
    title: 'Seasonal devotional series drive spike growth',
    detail:
      'Christmas, Easter, and Lent represent 3–5× baseline growth opportunities for devotional apps. A dedicated 21-day Advent or 40-day Lent series with daily push notifications can anchor long-term retention.',
    urgency: 'Medium',
    color: '#f59e0b',
  },
  {
    title: 'Leader Dashboard utilization predicts group retention',
    detail:
      'Leaders who actively use the group dashboard (assignments, analytics) retain 80% of their members vs 30% for passive leaders. A monthly "your group this month" email to leaders boosts dashboard opens.',
    urgency: 'Medium',
    color: '#f59e0b',
  },
  {
    title: 'Email digest re-engagement for lapsed users',
    detail:
      'Users who haven\'t opened the app in 14 days respond well to a single "You left something unfinished" email that links to their last journal entry or half-completed challenge. Avoid generic re-engagement copy.',
    urgency: 'Medium',
    color: '#f59e0b',
  },
  {
    title: 'Family plan is under-marketed to existing Growth users',
    detail:
      'Parents on the Growth plan who have used the app for 3+ months are the highest-intent Family plan prospects. A targeted in-app banner — shown only to this cohort — could yield 10–20% upgrade rate.',
    urgency: 'Low',
    color: '#6b7280',
  },
];

/* ─── Main component ──────────────────────────────────────────────────────── */

const LandscapeTab: React.FC = () => {
  const [data, setData] = useState<LandscapeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ── Users ──────────────────────────────────────────────────────────
        const usersSnap = await getDocs(collection(db, 'users'));
        let totalUsers = 0;
        let newThisWeek = 0;
        let newThisMonth = 0;
        const tiers: LandscapeData['tierDistribution'] = {
          free: 0,
          pro: 0,
          max: 0,
          partner: 0,
        };

        usersSnap.forEach((doc) => {
          const d = doc.data();
          totalUsers++;
          const tier = (d.subscriptionTier ?? d.tier ?? 'free') as string;
          if (tier === 'pro' || tier === 'growth') {
            tiers.pro++;
          } else if (tier === 'max' || tier === 'family') {
            tiers.max++;
          } else if (tier === 'partner' || tier === 'leader') {
            tiers.partner++;
          } else {
            tiers.free++;
          }

          // Parse createdAt — can be Firestore Timestamp or ISO string
          let createdAt: Date;
          if (d.createdAt?.toDate) {
            createdAt = d.createdAt.toDate() as Date;
          } else if (d.createdAt) {
            createdAt = new Date(d.createdAt as string);
          } else {
            createdAt = new Date(0);
          }

          if (createdAt > oneWeekAgo) newThisWeek++;
          if (createdAt > oneMonthAgo) newThisMonth++;
        });

        // ── Donations ──────────────────────────────────────────────────────
        const donationsSnap = await getDocs(
          query(collection(db, 'donations'), where('status', '==', 'successful'))
        );
        let totalRaised = 0;
        const donorUids = new Set<string>();

        donationsSnap.forEach((doc) => {
          const d = doc.data();
          totalRaised += (d.amount as number) || 0;
          if (d.uid) donorUids.add(d.uid as string);
        });

        const totalDonors = donorUids.size;
        const totalDonations = donationsSnap.size;
        const avgGift = totalDonations > 0 ? totalRaised / totalDonations : 0;

        setData({
          totalUsers,
          newThisWeek,
          newThisMonth,
          tierDistribution: tiers,
          totalDonors,
          totalRaised,
          avgGift,
          totalDonations,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load landscape data';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon className="w-8 h-8 animate-spin text-brand-accent" />
        <span className="ml-3 text-brand-text-secondary">Loading landscape data…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <p className="text-sm text-brand-text-secondary">
          {error ?? 'No data available. Connect Firestore collections to populate this view.'}
        </p>
      </Card>
    );
  }

  const tierTotal = Object.values(data.tierDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── User Base ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-4">
          User Base
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Members" value={data.totalUsers.toLocaleString()} />
          <MetricCard label="New This Week" value={data.newThisWeek} sub="last 7 days" />
          <MetricCard label="New This Month" value={data.newThisMonth} sub="last 30 days" />
          <MetricCard
            label="Weekly Growth"
            value={
              data.totalUsers > 0
                ? `${((data.newThisWeek / data.totalUsers) * 100).toFixed(1)}%`
                : '—'
            }
            sub="of total base"
          />
        </div>
      </div>

      {/* ── Tier Distribution ─────────────────────────────────────────── */}
      <Card>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-5">
          Tier Distribution
        </p>
        <div className="space-y-4">
          <BarRow
            label="Foundation (Free)"
            value={data.tierDistribution.free}
            total={tierTotal}
            color="#6b7280"
          />
          <BarRow
            label="Growth"
            value={data.tierDistribution.pro}
            total={tierTotal}
            color="#f59e0b"
          />
          <BarRow
            label="Family"
            value={data.tierDistribution.max}
            total={tierTotal}
            color="#f27d26"
          />
          <BarRow
            label="Leader"
            value={data.tierDistribution.partner}
            total={tierTotal}
            color="#8e1b1b"
          />
        </div>
        <p className="mt-4 text-xs text-brand-text-secondary">
          {tierTotal > 0
            ? `${Math.round(((tierTotal - data.tierDistribution.free) / tierTotal) * 100)}% of members are on a paid plan.`
            : 'No tier data yet.'}
        </p>
      </Card>

      {/* ── Donation Health ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-4">
          Stewardship Health
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Donors" value={data.totalDonors.toLocaleString()} />
          <MetricCard
            label="Total Raised"
            value={`$${data.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <MetricCard
            label="Avg Gift"
            value={`$${data.avgGift.toFixed(2)}`}
            sub="per transaction"
          />
          <MetricCard
            label="Donor Rate"
            value={
              data.totalUsers > 0
                ? `${((data.totalDonors / data.totalUsers) * 100).toFixed(1)}%`
                : '—'
            }
            sub="of total members"
          />
        </div>
      </div>

      {/* ── Market Trend Suggestions ──────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-4">
          Growth Opportunities
        </p>
        <div className="space-y-3">
          {TREND_SUGGESTIONS.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-brand-border bg-brand-dark p-5"
              style={{ borderLeft: `3px solid ${s.color}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${s.color}20`, color: s.color }}
                >
                  {s.urgency}
                </span>
                <h4 className="text-sm font-bold text-brand-text-primary">{s.title}</h4>
              </div>
              <p className="text-xs leading-relaxed text-brand-text-secondary">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default LandscapeTab;
