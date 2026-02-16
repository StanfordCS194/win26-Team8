// Email service for sending unlock passwords to friends
// This uses a simple approach - you can replace with your preferred email service

export interface UnlockEmailData {
  friendName: string;
  friendEmail: string;
  itemName: string;
  unlockPassword: string;
  unlockLink: string;
  userName?: string;
}

export async function sendUnlockPasswordEmail(data: UnlockEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll use a simple approach with mailto or a webhook
    // In production, you should use a proper email service like:
    // - Supabase Edge Functions with Resend/SendGrid
    // - AWS SES
    // - Mailgun
    // - Or any other email service
    
    // Option 1: Use Supabase Edge Function (recommended)
    // You would create an edge function that sends emails via Resend/SendGrid/etc.
    
    // Option 2: For development/testing, we can log the email details
    // In production, replace this with actual email sending
    
    console.log('📧 Email to send:', {
      to: data.friendEmail,
      subject: `Unlock Password`,
      body: generateEmailBody(data),
    });
    
    // TODO: Replace with actual email sending
    // For now, we'll simulate success
    // In production, implement actual email sending here
    
    // Example using fetch to a Supabase Edge Function:
    /*
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-unlock-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: data.friendEmail,
        subject: `Unlock Password for ${data.itemName}`,
        html: generateEmailBody(data),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    */
    
    // For now, return success (you'll need to implement actual email sending)
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

function generateEmailBody(data: UnlockEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .password-box { background-color: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .password { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4F46E5; font-family: monospace; }
        .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Unlock Password</h1>
        </div>
        <div class="content">
          <p>Hi ${data.friendName},</p>
          
          <p>${data.userName || 'A friend'} has asked you to help unlock an item after they complete their goal.</p>
          
          <div class="password-box">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your unlock password:</p>
            <div class="password">${data.unlockPassword}</div>
          </div>
          
          <p>Once ${data.userName || 'your friend'} has completed their goal, you can unlock the item by visiting the item page and entering the password above.</p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            To unlock: Go to the item page and enter the password in the unlock field.
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            This password is unique to you and should not be shared with anyone else.
          </p>
        </div>
        <div class="footer">
          <p>This email was sent from Second Thought app</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Plain text version for email clients that don't support HTML
export function generatePlainTextEmail(data: UnlockEmailData): string {
  return `
Hi ${data.friendName},

${data.userName || 'A friend'} has asked you to help unlock an item after they complete their goal.

Your unlock password: ${data.unlockPassword}

Once ${data.userName || 'your friend'} has completed their goal, you can unlock the item by visiting the item page and entering the password above in the unlock field.

This password is unique to you and should not be shared with anyone else.

---
This email was sent from Second Thought app
  `.trim();
}
