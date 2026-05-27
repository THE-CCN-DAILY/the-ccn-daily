/* ─────────────────────────────────────────────────────────────────────────────
 * Email Service
 * All outbound email is routed through the Cloudflare Worker at
 * /api/email/* which calls Resend server-side (key never exposed to the
 * browser).  When no RESEND_API_KEY is configured on the Worker, the
 * endpoint returns { success: true, source: 'no-op' } — graceful degradation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface GiftEmailPayload {
  recipientEmail: string;
  personalMessage: string;
  giftedItemTitle: string;
  senderName?: string;
}

export const sendGiftEmail = async (
  payload: GiftEmailPayload
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const response = await fetch('/api/email/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { success?: boolean; messageId?: string; error?: string };

    if (!response.ok || !data.success) {
      return { success: false };
    }

    return { success: true, messageId: data.messageId };
  } catch {
    return { success: false };
  }
};
