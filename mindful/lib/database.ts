import { supabase } from '../env';
import type { Item, ItemCategory, QuestionAnswer } from '../types/item';

/**
 * DATABASE ITEM INTERFACE
 * Matches the Supabase items table schema exactly
 */
export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  product_url: string | null;
  category: string | null;
  constraint_type: 'time' | 'goals';
  consumption_score: number;
  wait_until_date: string | null;
  difficulty: string | null;
  questionnaire: QuestionAnswer[]; // JSONB field
  added_date: string;
  created_at: string;
  updated_at: string;
  // Friend unlock fields – match Supabase schema
  friend_name: string | null;
  friend_email: string | null;
  unlock_password: string | null;
  is_unlocked: boolean | null;
}

// Unlocked items table row
export interface DbUnlockedItem {
  id: string;
  user_id: string;
  original_item_id: string;
  name: string;
  image_url: string | null;
  product_url: string | null;
  category: string | null;
  constraint_type: 'time' | 'goals';
  consumption_score: number;
  wait_until_date: string | null;
  difficulty: string | null;
  questionnaire: QuestionAnswer[];
  added_date: string;
  unlocked_at: string;
  friend_name: string | null;
  friend_email: string | null;
  unlock_password: string | null;
}

/**
 * CONVERT APP ITEM TO DATABASE FORMAT
 * Simple conversion: camelCase → snake_case
 */
function itemToDb(item: Item, userId: string): Omit<DbItem, 'created_at' | 'updated_at'> {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl || null,
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
}

/**
 * CONVERT DATABASE ROW TO APP ITEM
 * Simple conversion: snake_case → camelCase
 */
function dbToItem(dbItem: DbItem): Item {
  return {
    id: dbItem.id,
    name: dbItem.name,
    isUnlocked: dbItem.is_unlocked ?? false,
    imageUrl: dbItem.image_url || undefined,
    productUrl: dbItem.product_url || undefined,
    category: dbItem.category as ItemCategory | undefined,
    constraintType: dbItem.constraint_type,
    consumptionScore: dbItem.consumption_score,
    addedDate: dbItem.added_date,
    waitUntilDate: dbItem.wait_until_date || undefined,
    difficulty: dbItem.difficulty as 'easy' | 'medium' | 'hard' | undefined,
    questionnaire: dbItem.questionnaire,
    // Friend unlock fields
    friendName: dbItem.friend_name || undefined,
    friendEmail: dbItem.friend_email || undefined,
    unlockPassword: dbItem.unlock_password || undefined,
  };
}

// Convert unlocked_items row back into an Item (legacy; app now uses items.is_unlocked)
function dbUnlockedToItem(row: DbUnlockedItem): Item {
  return {
    id: row.original_item_id,
    isUnlocked: true,
    name: row.name,
    imageUrl: row.image_url || undefined,
    productUrl: row.product_url || undefined,
    category: row.category as ItemCategory | undefined,
    constraintType: row.constraint_type,
    consumptionScore: row.consumption_score,
    addedDate: row.added_date,
    waitUntilDate: row.wait_until_date || undefined,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard' | undefined,
    questionnaire: row.questionnaire,
    friendName: row.friend_name || undefined,
    friendEmail: row.friend_email || undefined,
    unlockPassword: row.unlock_password || undefined,
  };
}

// Columns needed for list/detail – include friend/unlock fields so guard info is preserved
const ITEMS_SELECT =
  'id, user_id, name, image_url, product_url, category, constraint_type, consumption_score, wait_until_date, difficulty, questionnaire, added_date, created_at, updated_at, friend_name, friend_email, unlock_password, is_unlocked';
const UNLOCKED_ITEMS_SELECT =
  'id, user_id, original_item_id, name, image_url, product_url, category, constraint_type, consumption_score, wait_until_date, difficulty, questionnaire, added_date, unlocked_at, friend_name, friend_email, unlock_password';

/**
 * FETCH ALL ITEMS FOR A USER
 * Uses index (user_id, created_at DESC) when present. Selects only needed columns for faster response.
 *
 * @param userId - User's UUID
 * @returns { items: Item[], error: any }
 */
export async function fetchItems(userId: string): Promise<{ items: Item[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select(ITEMS_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Fetch error:', error);
      return { items: [], error };
    }

    if (!data) {
      console.log('📦 No items found');
      return { items: [], error: null };
    }

    const items = data.map(dbToItem);
    console.log('✅ Loaded', items.length, 'items from Supabase');
    return { items, error: null };
  } catch (error) {
    console.error('❌ Fetch exception:', error);
    return { items: [], error };
  }
}

/**
 * FETCH ALL UNLOCKED ITEMS FOR A USER
 */
export async function fetchUnlockedItems(userId: string): Promise<{ items: Item[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('unlocked_items')
      .select(UNLOCKED_ITEMS_SELECT)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch unlocked_items error:', error);
      return { items: [], error };
    }

    if (!data) {
      return { items: [], error: null };
    }

    const items = (data as DbUnlockedItem[]).map(dbUnlockedToItem);
    return { items, error: null };
  } catch (error) {
    console.error('❌ Fetch unlocked_items exception:', error);
    return { items: [], error };
  }
}

/**
 * Fetch product_url values for a user (for duplicate-URL check).
 */
export async function fetchUserProductUrls(userId: string): Promise<{ urls: string[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('product_url')
      .eq('user_id', userId)
      .not('product_url', 'is', null);

    if (error) return { urls: [], error };
    const urls = (data || []).map((r: { product_url: string | null }) => r.product_url).filter(Boolean) as string[];
    return { urls, error: null };
  } catch (error) {
    return { urls: [], error };
  }
}

/**
 * SAVE NEW ITEM TO DATABASE
 * 
 * @param item - Item to save
 * @param userId - User's UUID
 * @returns { success: boolean, error: any }
 */
export async function saveItem(item: Item, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('💾 Saving item:', item.name);
    console.log('👤 User ID:', userId);
    
    // Convert to database format
    const dbItem = itemToDb(item, userId);
    
    console.log('📝 Database item (summary):', {
      name: dbItem.name,
      image_url: dbItem.image_url,
      image_url_length: dbItem.image_url?.length || 0,
      constraint_type: dbItem.constraint_type,
      consumption_score: dbItem.consumption_score,
      wait_until_date: dbItem.wait_until_date,
      difficulty: dbItem.difficulty,
      questionnaire_count: dbItem.questionnaire.length,
    });
    
    console.log('📝 Full database item:', JSON.stringify(dbItem, null, 2));
    
    // Validate required fields
    if (!dbItem.name || !dbItem.user_id || !dbItem.constraint_type) {
      const error = new Error('Missing required fields: name, user_id, or constraint_type');
      console.error('❌ Validation failed:', error);
      return { success: false, error };
    }
    
    if (!dbItem.questionnaire || dbItem.questionnaire.length === 0) {
      const error = new Error('Questionnaire must have at least one question');
      console.error('❌ Validation failed:', error);
      return { success: false, error };
    }
    
    if (dbItem.consumption_score < 1 || dbItem.consumption_score > 10) {
      const error = new Error('Consumption score must be between 1 and 10');
      console.error('❌ Validation failed:', error);
      return { success: false, error };
    }
    
    // Check image URL if provided
    if (dbItem.image_url) {
      console.log('🖼️ Image URL provided:', dbItem.image_url.substring(0, 100) + '...');
      console.log('🖼️ Image URL length:', dbItem.image_url.length);
      
      // Very long URLs might cause issues
      if (dbItem.image_url.length > 2048) {
        console.warn('⚠️ Image URL is very long (', dbItem.image_url.length, 'chars). This might cause issues.');
      }
    } else {
      console.log('🖼️ No image URL provided (will be null in database)');
    }
    
    console.log('✅ Validation passed');
    
    // First, test basic connectivity
    console.log('🌐 Testing network connectivity to Supabase...');
    try {
      const pingStart = Date.now();
      const pingResponse = await fetch('https://mohgivduzthccoybnbnr.supabase.co/rest/v1/', {
        method: 'HEAD',
      });
      const pingElapsed = Date.now() - pingStart;
      console.log(`✅ Network reachable (${pingElapsed}ms), status: ${pingResponse.status}`);
    } catch (pingError) {
      console.error('❌ NETWORK BLOCKED - Cannot reach Supabase:', pingError);
      return { 
        success: false, 
        error: new Error('Network blocked: Cannot reach Supabase. Check VPN, firewall, or browser extensions.')
      };
    }
    
    console.log('📡 Network OK, now inserting item...');
    
    // Try a simpler insert without .select().single() which might be causing issues
    const startTime = Date.now();
    
    console.log('🔧 Attempting insert (without select)...');
    
    // Create insert promise - simplified version
    const insertPromise = supabase
      .from('items')
      .insert([dbItem]);
    
    // Create timeout promise (15 seconds)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`⏱️ TIMEOUT after ${elapsed}ms`);
        console.error('❌ The insert request is hanging.');
        console.error('❌ Possible causes:');
        console.error('   1. RLS policy blocking insert');
        console.error('   2. Trigger/function hanging in database');
        console.error('   3. Supabase client issue');
        console.error('   4. Network middleware interfering');
        reject(new Error('Insert timed out after 15 seconds'));
      }, 15000)
    );
    
    // Race them
    console.log('🏁 Racing insert vs 15s timeout...');
    const result = await Promise.race([insertPromise, timeoutPromise]);
    const elapsed = Date.now() - startTime;
    
    console.log(`⏱️ Request completed in ${elapsed}ms`);
    
    const { error } = result as any;
    
    if (error) {
      console.error('❌ Insert error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      // Log the exact item that failed
      console.error('❌ Failed to insert this item:', JSON.stringify(dbItem, null, 2));
      
      return { success: false, error };
    }

    console.log('✅ Item saved successfully!');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Save exception (caught):', error);
    console.error('❌ Exception type:', typeof error);
    console.error('❌ Exception details:', error);
    return { success: false, error };
  }
}

/**
 * SAVE DELETION REASON (when user deletes before constraint completion)
 *
 * @param params - { itemId, itemName, userId, reason, subReason, constraintType }
 * @returns { success: boolean, error: any }
 */
export async function saveDeletionReason(params: {
  itemId: string;
  itemName: string;
  userId: string;
  reason: 'dont_want' | 'purchased_early';
  subReason: string;
  constraintType: 'time' | 'goals';
}): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase.from('item_deletion_reasons').insert([
      {
        user_id: params.userId,
        item_id: params.itemId,
        item_name: params.itemName,
        reason: params.reason,
        sub_reason: params.subReason,
        constraint_type: params.constraintType,
      },
    ]);

    if (error) {
      console.error('❌ Save deletion reason error:', error);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Save deletion reason exception:', error);
    return { success: false, error };
  }
}

/**
 * SAVE UNLOCKED ITEM TO SEPARATE ARCHIVE TABLE
 * Called when a constraint has been successfully completed (time or goals).
 */
export async function saveUnlockedItem(
  item: Item,
  userId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const payload = {
      user_id: userId,
      original_item_id: item.id,
      name: item.name,
      image_url: item.imageUrl || null,
      product_url: item.productUrl || null,
      category: item.category || null,
      constraint_type: item.constraintType,
      consumption_score: item.consumptionScore,
      wait_until_date: item.waitUntilDate || null,
      difficulty: item.difficulty || null,
      questionnaire: item.questionnaire,
      added_date: item.addedDate,
      friend_name: item.friendName || null,
      friend_email: item.friendEmail || null,
      unlock_password: item.unlockPassword || null,
    };

    const { error } = await supabase.from('unlocked_items').insert([payload]);

    if (error) {
      console.error('❌ Save unlocked item error:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Save unlocked item exception:', error);
    return { success: false, error };
  }
}

/**
 * UPDATE ITEM'S is_unlocked FLAG (time expired or goal password entered)
 * Keeps the item in the items table; does not delete or move to another table.
 */
export async function updateItemUnlocked(
  itemId: string,
  userId: string,
  isUnlocked: boolean
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await supabase
      .from('items')
      .update({ is_unlocked: isUnlocked })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Update is_unlocked error:', error);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Update is_unlocked exception:', error);
    return { success: false, error };
  }
}

/**
 * DELETE AN ITEM FROM DATABASE
 * 
 * @param itemId - Item's UUID
 * @param userId - User's UUID (for security)
 * @returns { success: boolean, error: any }
 */
export async function deleteItem(itemId: string, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🗑️ Deleting item:', itemId);
    
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error };
    }

    console.log('✅ Item deleted successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Delete exception:', error);
    return { success: false, error };
  }
}

/**
 * DELETE AN UNLOCKED ITEM FROM THE ARCHIVE (unlocked_items table)
 * Same flow as deleteItem for items: delete by table primary key (id) and user_id only.
 */
export async function deleteUnlockedItem(
  rowId: string,
  userId: string
): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🗑️ Deleting unlocked item row:', rowId);

    const { error } = await supabase
      .from('unlocked_items')
      .delete()
      .eq('id', rowId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Delete unlocked item error:', error);
      return { success: false, error };
    }

    console.log('✅ Unlocked item deleted successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Delete unlocked item exception:', error);
    return { success: false, error };
  }
}

/**
 * TEST CONNECTION TO SUPABASE
 * Useful for debugging connection issues
 */
export async function testConnection(): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🔌 Testing Supabase connection...');
    console.log('📍 Testing URL: https://mohgivduzthccoybnbnr.supabase.co');
    
    // First test raw fetch
    console.log('🌐 Step 1: Testing raw network fetch...');
    try {
      const fetchStart = Date.now();
      const response = await fetch('https://mohgivduzthccoybnbnr.supabase.co/rest/v1/', {
        method: 'HEAD',
      });
      const fetchElapsed = Date.now() - fetchStart;
      console.log(`✅ Network fetch OK (${fetchElapsed}ms), status:`, response.status);
    } catch (fetchError) {
      console.error('❌ Network fetch FAILED:', fetchError);
      return { success: false, error: new Error('Cannot reach Supabase - network blocked') };
    }
    
    // Then test Supabase client
    console.log('🌐 Step 2: Testing Supabase client...');
    const { error, count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase client test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Supabase connection OK, items count:', count);
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return { success: false, error };
  }
}
