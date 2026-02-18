import { supabase } from '../env';
import type { Item, QuestionAnswer } from '../App';

/**
 * ALTERNATIVE SAVE METHOD - Using Direct REST API
 * 
 * This bypasses the Supabase client and uses direct fetch() calls
 * Use this if the Supabase client is hanging
 */
export async function saveItemDirect(item: Item, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('💾 [DIRECT] Saving item:', item.name);
    
    // Get the session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    
    if (!token) {
      return { success: false, error: new Error('No auth token - user not logged in') };
    }
    
    // Prepare the item data
    const dbItem = {
      id: item.id,
      user_id: userId,
      name: item.name,
      image_url: null,
      constraint_type: item.constraintType,
      consumption_score: item.consumptionScore,
      added_date: item.addedDate,
      wait_until_date: item.waitUntilDate || null,
      difficulty: item.difficulty || null,
      questionnaire: item.questionnaire,
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
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Direct API call timed out after 10 seconds')), 10000)
    );
    
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
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
