export async function sendOpsAlert(input: {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  featureKey: string;
  reasons: string[];
}) {
  console.warn('[OPS ALERT]', input);

  // Optional webhook integration
  // if (process.env.OPS_WEBHOOK_URL) {
  //   await fetch(process.env.OPS_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(input),
  //   });
  // }
}
