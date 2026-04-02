type Variant = string;

interface ExperimentConfig {
  key: string;
  variants: Variant[];
}

const EXPERIMENTS: ExperimentConfig[] = [
  { key: 'paywall_layout_v1', variants: ['A', 'B'] },
  { key: 'annual_default_v1', variants: ['A', 'B'] },
  { key: 'trial_length_v1', variants: ['A', 'B', 'C'] },
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function assignVariant(userId: string, experimentKey: string): Variant {
  const exp = EXPERIMENTS.find(e => e.key === experimentKey);
  if (!exp) return 'A';
  const idx = hashString(`${experimentKey}:${userId}`) % exp.variants.length;
  return exp.variants[idx];
}

export function getAllAssignments(userId: string): Record<string, string> {
  return EXPERIMENTS.reduce((acc, exp) => {
    acc[exp.key] = assignVariant(userId, exp.key);
    return acc;
  }, {} as Record<string, string>);
}

export const ACTIVE_EXPERIMENTS = EXPERIMENTS;
