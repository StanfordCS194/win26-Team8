import { supabase } from '../env';
import type { Item, QuestionAnswer } from '../App';

/**
 * TEST SUPABASE CONNECTION
 * 
 * Quick test to verify Supabase is reachable and credentials are valid.
 * This doesn't require any data - it just pings the database.
 */
export async function testConnection(): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    const testPromise = supabase
      .from('items')
      .select('count', { count: 'exact', head: true });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection test timed out after 10 seconds')), 10000)
    );
    
    const result = await Promise.race([testPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('❌ Connection test failed:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('✅ Supabase connection OK');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Connection test exception:', error);
    return { success: false, error };
  }
}

export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  constraint_type: 'time' | 'goals';
  consumption_score: number;
  added_date: string;
  wait_until_date?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionnaire: QuestionAnswer[]; // Stored as JSONB in database
  created_at?: string;
  updated_at?: string;
}

/**
 * ITEM TO DATABASE (itemToDb)
 * 
 * Converts an Item from the app's format to the database format.
 * 
 * KEY TRANSFORMATIONS:
 * 1. Field naming: camelCase → snake_case
 *    - imageUrl → image_url
 *    - constraintType → constraint_type
 *    - consumptionScore → consumption_score
 * 
 * 2. Questionnaire: Passes through as-is (stored as JSONB)
 *    - App: questionnaire = [{ id, question, answer }, ...]
 *    - Database: questionnaire = [{ id, question, answer }, ...] (JSONB)
 * 
 * 3. User association: Adds user_id
 *    - Links this item to its owner
 *    - Enforced by RLS policies
 * 
 * @param item - The Item object from the app
 * @param userId - The user who owns this item
 * @returns Database-ready object with snake_case fields
 */
function itemToDb(item: Item, userId: string): Omit<DbItem, 'created_at' | 'updated_at'> {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl,
    constraint_type: item.constraintType,
    consumption_score: item.consumptionScore,
    added_date: item.addedDate,
    wait_until_date: item.waitUntilDate,
    difficulty: item.difficulty,
    questionnaire: item.questionnaire, // Stored as JSONB - no conversion needed!
  };
}

/**
 * DATABASE TO ITEM (dbToItem)
 * 
 * Converts a database row to the app's Item format.
 * 
 * KEY TRANSFORMATIONS:
 * 1. Field naming: snake_case → camelCase
 *    - image_url → imageUrl
 *    - constraint_type → constraintType
 *    - consumption_score → consumptionScore
 * 
 * 2. Questionnaire: Passes through as-is (already parsed from JSONB)
 *    - Database: questionnaire = [{ id, question, answer }, ...] (JSONB)
 *    - App: questionnaire = [{ id, question, answer }, ...]
 * 
 * @param dbItem - The database row from Supabase (snake_case)
 * @returns App-ready Item object (camelCase)
 */
function dbToItem(dbItem: DbItem): Item {
  return {
    id: dbItem.id,
    name: dbItem.name,
    imageUrl: dbItem.image_url,
    constraintType: dbItem.constraint_type,
    consumptionScore: dbItem.consumption_score,
    addedDate: dbItem.added_date,
    waitUntilDate: dbItem.wait_until_date,
    difficulty: dbItem.difficulty,
    questionnaire: dbItem.questionnaire, // Already an array from JSONB!
  };
}

/**
 * FETCH ITEMS FROM DATABASE
 * 
 * This function retrieves all items for a specific user from the Supabase database.
 * 
 * How it works:
 * 1. Connects to Supabase 'items' table
 * 2. Queries for all rows where user_id matches the logged-in user
 * 3. Orders results by creation date (newest first)
 * 4. Transforms database format (snake_case) to app format (camelCase)
 * 5. Returns array of items or empty array if error
 * 
 * @param userId - The UUID of the currently logged-in user
 * @returns Promise with { items: Item[], error: any }
 */
export async function fetchItems(userId: string): Promise<{ items: Item[]; error: any }> {
  try {
    console.log('📥 Fetching items for user:', userId);
    
    // Create the Supabase query to fetch items
    // - from('items'): Query the 'items' table
    // - select('*'): Get all columns
    // - eq('user_id', userId): Filter to only this user's items (RLS also enforces this)
    // - order('created_at', { ascending: false }): Sort by newest first
    const fetchPromise = supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Add a timeout to prevent the app from hanging if Supabase is slow
    // If the query takes more than 5 seconds, we reject with a timeout error
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timed out after 5 seconds')), 5000)
    );
    
    // Race the fetch against the timeout - whichever completes first wins
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    
    // Check if Supabase returned an error
    if (result.error) {
      console.error('❌ Fetch error:', result.error);
      console.error('❌ Error message:', result.error.message);
      console.error('❌ Error details:', result.error.details);
      return { items: [], error: result.error };
    }

    console.log('📦 Raw data from Supabase:', result.data);
    console.log('📊 Number of rows returned:', result.data?.length || 0);
    
    // Transform database items (snake_case fields) to app items (camelCase fields)
    // dbToItem() converts fields like 'user_id' → 'userId', 'image_url' → 'imageUrl', etc.
    const items = (result.data || []).map(dbToItem);
    console.log('✅ Loaded', items.length, 'items from Supabase');
    console.log('📋 Items:', items);
    return { items, error: null };
  } catch (error) {
    console.error('❌ Fetch exception:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error type:', errorMsg);
    return { items: [], error };
  }
}

/**
 * SAVE ITEM TO DATABASE
 * 
 * This function inserts a new item into the Supabase database.
 * 
 * How it works:
 * 1. Converts the app's Item object (camelCase) to database format (snake_case)
 * 2. Inserts the item into the 'items' table
 * 3. Row Level Security (RLS) policies ensure users can only insert their own items
 * 4. Returns success/failure status
 * 
 * Database fields saved:
 * - id: Unique identifier (UUID)
 * - user_id: Owner of the item (enforced by RLS)
 * - name: Item name
 * - image_url: URL to item image
 * - constraint_type: 'time' or 'goals'
 * - consumption_score: 1-10 rating
 * - added_date: When item was added
 * - wait_until_date: For time-based items
 * - difficulty: For goals-based items ('easy', 'medium', 'hard')
 * - questionnaire_why/alternatives/impact/urgency: Reflection answers
 * 
 * @param item - The item object to save (from the app)
 * @param userId - The UUID of the user who owns this item
 * @returns Promise with { success: boolean, error: any }
 */
export async function saveItem(item: Item, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('💾 Saving item:', item.name);
    console.log('👤 User ID:', userId);
    console.log('🔍 Item data:', JSON.stringify(item, null, 2));
    
    // Transform the app's Item format to the database format
    // itemToDb() converts camelCase → snake_case and adds user_id
    const dbItem = itemToDb(item, userId);
    console.log('📝 Database item:', JSON.stringify(dbItem, null, 2));
    
    // Validate questionnaire array has at least one question
    if (!dbItem.questionnaire || dbItem.questionnaire.length === 0) {
      const error = new Error('Questionnaire is required and must have at least one question');
      console.error('❌ Validation failed:', error);
      return { success: false, error };
    }
    
    console.log('📡 Sending insert request to Supabase (30 second timeout)...');
    console.log('⏱️ Request started at:', new Date().toISOString());
    
    // Create the Supabase insert query
    const insertPromise = supabase
      .from('items')
      .insert([dbItem])
      .select();
    
    // Add a 30-second timeout to prevent indefinite hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        console.error('⏱️ Timeout triggered at:', new Date().toISOString());
        reject(new Error('Insert timed out after 30 seconds'));
      }, 30000)
    );
    
    // Race the insert against the timeout
    console.log('🏁 Racing insert vs timeout...');
    const result = await Promise.race([insertPromise, timeoutPromise]) as any;
    console.log('🏁 Race completed at:', new Date().toISOString());

    // Check if the insert failed
    if (result.error) {
      console.error('❌ Save error:', result.error);
      console.error('❌ Error message:', result.error.message);
      console.error('❌ Error details:', result.error.details);
      console.error('❌ Error hint:', result.error.hint);
      console.error('❌ Error code:', result.error.code);
      return { success: false, error: result.error };
    }

    // Success! The item was inserted into the database
    console.log('✅ Item saved successfully to Supabase!', result.data);
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Save exception:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error type:', errorMsg);
    return { success: false, error };
  }
}

export async function deleteItem(itemId: string, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🗑️ Deleting item:', itemId);
    
    // Add timeout to delete as well
    const deletePromise = supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Delete timed out after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([deletePromise, timeoutPromise]) as any;

    if (result.error) {
      console.error('❌ Delete error:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Item deleted');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Delete exception:', error);
    return { success: false, error };
  }
}
