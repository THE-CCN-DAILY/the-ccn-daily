// Mock email service to simulate sending transactional emails.
// In a real application, this would use the Resend SDK with an API key.

export interface GiftEmailPayload {
  recipientEmail: string;
  personalMessage: string;
  giftedItemTitle: string;
  senderName?: string; // e.g., 'The CCN Daily Team' or the user's name
}

export const sendGiftEmail = async (payload: GiftEmailPayload): Promise<{ success: boolean; messageId?: string }> => {
  console.log("Simulating sending gift email:", payload);
  // Simulate network delay to show loading state in UI
  await new Promise(resolve => setTimeout(resolve, 1200));

  // In a real implementation:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { data, error } = await resend.emails.send({
  //   from: 'The CCN Daily <gifts@yourdomain.com>',
  //   to: [payload.recipientEmail],
  //   subject: `You've received a gift: ${payload.giftedItemTitle}!`,
  //   react: <GiftEmailTemplate {...payload} />,
  // });
  // if (error) return { success: false };

  console.log(`Email successfully sent to ${payload.recipientEmail}`);
  return { success: true, messageId: `mock_${Date.now()}` };
};
