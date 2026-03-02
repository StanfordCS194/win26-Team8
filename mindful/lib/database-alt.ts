import { supabase } from '../env';
import type { Item, QuestionAnswer } from '../types/item';

/**
 * ALTERNATIVE SAVE METHOD - Using Direct REST API
 *
 * Pass accessToken when you already have it (e.g. from AuthContext) to avoid
 * calling getSession(), which can hang on slow networks.
 */
export async function saveItemDirect(
  item: Item,
  userId: string,
  accessToken?: string | null
): Promise<{ success: boolean; error: any }> {
  try {
    console.log('💾 [DIRECT] Saving item:', item.name);
    
    let token = accessToken ?? null;
    if (!token) {
      const sessionTimeoutMs = 5000;
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session check timed out. Try refreshing the page.')), sessionTimeoutMs)
      );
      const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: { access_token: string } | null } };
      token = sessionData?.session?.access_token ?? null;
    }
    
    if (!token) {
      return { success: false, error: new Error('No auth token - user not logged in') };
    }
    
    // Prepare the item data (normalize empty/whitespace image URL to null)
    const imageUrl = (item.imageUrl && item.imageUrl.trim()) ? item.imageUrl.trim() : null;
    const dbItem = {
      id: item.id,
      user_id: userId,
      name: item.name,
      image_url: imageUrl,
      product_url: item.productUrl || null,
      category: item.category || null,
      constraint_type: item.constraintType,
      consumption_score: item.consumptionScore,
      added_date: item.addedDate,
      wait_until_date: item.waitUntilDate || null,
      difficulty: item.difficulty || null,
      questionnaire: item.questionnaire,
      // Friend unlock fields
      friend_name: item.friendName || null,
      friend_email: item.friendEmail || null,
      unlock_password: item.unlockPassword || null,
      is_unlocked: false,
    };
    
    console.log('📝 [DIRECT] Item to insert:', JSON.stringify(dbItem, null, 2));
    
    // Make direct REST API call
    const url = 'https://mohgivduzthccoybnbnr.supabase.co/rest/v1/items';
    
    console.log('📡 [DIRECT] Making direct REST API call...');
    
    // Add timeout to fetch
    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4',
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(dbItem),
    });
    
    const fetchTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Direct API call timed out after 10 seconds')), 10000)
    );
    
    const response = await Promise.race([fetchPromise, fetchTimeoutPromise]) as Response;
    
    console.log('📊 [DIRECT] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DIRECT] Insert failed:', response.status, errorText);
      return { success: false, error: new Error(`HTTP ${response.status}: ${errorText}`) };
    }
    
    console.log('✅ [DIRECT] Item saved successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ [DIRECT] Exception:', error);
    return { success: false, error };
  }
}

/**
 * Save deletion reason via direct REST API (with auth token).
 * Uses same pattern as saveItemDirect to avoid session/RLS issues.
 */
export async function saveDeletionReasonDirect(
  params: {
    itemId: string;
    itemName: string;
    userId: string;
    reason: 'dont_want' | 'purchased_early';
    subReason: string;
    constraintType: 'time' | 'goals';
  },
  accessToken: string | null
): Promise<{ success: boolean; error: any }> {
  try {
    if (!accessToken) {
      return { success: false, error: new Error('No auth token - user not logged in') };
    }

    const url = 'https://mohgivduzthccoybnbnr.supabase.co/rest/v1/item_deletion_reasons';
    const body = {
      user_id: params.userId,
      item_id: params.itemId,
      item_name: params.itemName,
      reason: params.reason,
      sub_reason: params.subReason,
      constraint_type: params.constraintType,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4',
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DIRECT] Save deletion reason failed:', response.status, errorText);
      return { success: false, error: new Error(`HTTP ${response.status}: ${errorText}`) };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ [DIRECT] Save deletion reason exception:', error);
    return { success: false, error };
  }
}
