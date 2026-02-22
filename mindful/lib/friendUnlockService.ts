import { supabase } from '../env';

/**
 * Service for managing friend unlock emails
 * Stores friend email and password information for sending unlock passwords
 */

export interface FriendUnlockEmail {
  id: string;
  item_id: string;
  friend_email: string;
  unlock_password: string;
  sent_at: string | null;
  created_at: string;
}

/**
 * Create a new friend unlock email record
 * This stores the friend's email and unlock password for later email sending
 */
export async function createFriendUnlockEmail(
  itemId: string,
  friendEmail: string,
  unlockPassword: string
): Promise<{ success: boolean; data?: FriendUnlockEmail; error?: any }> {
  try {
    console.log('📧 Creating friend unlock email record:', { itemId, friendEmail });
    
    const { data, error } = await supabase
      .from('friend_unlock_emails')
      .insert({
        item_id: itemId,
        friend_email: friendEmail,
        unlock_password: unlockPassword,
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
