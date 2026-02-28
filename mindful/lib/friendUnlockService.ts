import { supabase } from '../env';

/**
 * Service for managing friend unlock emails
 * Stores friend email information and sends emails via Resend API
 */

export interface FriendUnlockEmail {
  id: string;
  item_id: string;
  friend_email: string;
  unlock_password: string | null;
  friend_token: string;
  password_set_at: string | null;
  sent_at: string | null;
  created_at: string;
}

/**
 * Create a new friend unlock email record
 * Password is not set at creation — the friend will set it via the email link
 */
export async function createFriendUnlockEmail(
  itemId: string,
  friendEmail: string,
  unlockPassword?: string
): Promise<{ success: boolean; data?: FriendUnlockEmail; error?: any }> {
  try {
    console.log('📧 Creating friend unlock email record:', { itemId, friendEmail });

    const { data, error } = await supabase
      .from('friend_unlock_emails')
      .insert({
        item_id: itemId,
        friend_email: friendEmail,
        ...(unlockPassword ? { unlock_password: unlockPassword } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create friend unlock email:', error);
      return { success: false, error };
    }

    console.log('✅ Friend unlock email record created:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception creating friend unlock email:', error);
    return { success: false, error };
  }
}

/**
 * Send an email to the friend via Resend API with a link to set the unlock password
 */
export async function sendFriendEmail(params: {
  friendEmail: string;
  friendName: string;
  friendToken: string;
  userName: string;
  itemName: string;
  setPasswordPageUrl: string;
}): Promise<{ success: boolean; error?: any }> {
  const { friendEmail, friendName, friendToken, userName, itemName, setPasswordPageUrl } = params;
  const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('⚠️ EXPO_PUBLIC_RESEND_API_KEY not set, skipping email send');
    return { success: false, error: 'Resend API key not configured' };
  }

  const setPasswordUrl = `${setPasswordPageUrl}?token=${friendToken}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Second Thought <onboarding@resend.dev>',
        to: [friendEmail],
        subject: `${userName || 'Your friend'} needs your help with a goal!`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #255736; font-size: 24px;">Hi ${friendName || 'there'}!</h1>
            <p style="color: #333; line-height: 1.6;">
              <strong>${userName || 'Your friend'}</strong> is using <strong>Second Thought</strong> to practice
              mindful consumption. They've set a goal they need to complete before purchasing
              <strong>${itemName || 'an item'}</strong>.
            </p>
            <p style="color: #333; line-height: 1.6;">
              They've chosen you as their accountability partner! Please set a password that
              they'll need to enter once they've completed their goal.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${setPasswordUrl}"
                 style="background-color: #255736; color: white; padding: 14px 28px;
                        border-radius: 9999px; text-decoration: none; font-weight: bold;
                        display: inline-block;">
                Set Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              After you set the password, let ${userName || 'your friend'} know when they've
              earned it by completing their goal.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">
              This email was sent by Second Thought. If you didn't expect this, you can ignore it.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Resend API error:', errText);
      return { success: false, error: errText };
    }

    console.log('✅ Friend email sent successfully to', friendEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Exception sending friend email:', error);
    return { success: false, error };
  }
}

/**
 * Mark an email as sent by updating the sent_at timestamp
 */
export async function markEmailAsSent(
  emailId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('friend_unlock_emails')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', emailId);

    if (error) {
      console.error('❌ Failed to mark email as sent:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Exception marking email as sent:', error);
    return { success: false, error };
  }
}

/**
 * Get all pending (unsent) emails for a user's items
 * Useful for batch email sending
 */
export async function getPendingEmails(
  userId: string
): Promise<{ success: boolean; data?: FriendUnlockEmail[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('friend_unlock_emails')
      .select(`
        *,
        items!inner(user_id)
      `)
      .eq('items.user_id', userId)
      .is('sent_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch pending emails:', error);
      return { success: false, error };
    }

    return { success: true, data: data as FriendUnlockEmail[] };
  } catch (error) {
    console.error('❌ Exception fetching pending emails:', error);
    return { success: false, error };
  }
}

/**
 * Get friend unlock email by item ID
 */
export async function getFriendUnlockEmailByItemId(
  itemId: string
): Promise<{ success: boolean; data?: FriendUnlockEmail; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('friend_unlock_emails')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch friend unlock email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception fetching friend unlock email:', error);
    return { success: false, error };
  }
}
