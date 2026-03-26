import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment variables
// In a real app, this should ideally be done on the server side to protect the API key.
// For this prototype, we are initializing it here.
const SENDGRID_API_KEY = (import.meta as any).env.VITE_SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface GiftEmailPayload {
  recipientEmail: string;
  personalMessage: string;
  giftedItemTitle: string;
  senderName?: string; // e.g., 'The CCN Daily Team' or the user's name
}

export const sendGiftEmail = async (payload: GiftEmailPayload): Promise<{ success: boolean; messageId?: string }> => {
  console.log("Sending gift email via SendGrid:", payload);
  
  if (!SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY is not set. Simulating email send.");
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  const msg = {
    to: payload.recipientEmail,
    from: 'hello@updates.theccndaily.com', // Replace with your verified sender
    subject: `You've received a gift: ${payload.giftedItemTitle}!`,
    text: `Hello! ${payload.senderName || 'Someone'} has sent you a gift: ${payload.giftedItemTitle}.\n\nMessage: ${payload.personalMessage}`,
    html: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
        <h2 style="color: #F27D26;">You've received a gift!</h2>
        <p><strong>${payload.senderName || 'Someone'}</strong> has sent you access to: <strong>${payload.giftedItemTitle}</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${payload.personalMessage}"</p>
        </div>
        <p>Log in to your account to access your new content.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">The CCN Daily Team</p>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`Email successfully sent to ${payload.recipientEmail}`, response);
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error("Error sending email via SendGrid:", error);
    return { success: false };
  }
};
