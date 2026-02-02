import { supabase } from '../env';
import type { Item } from '../App';

// Database type that matches Supabase schema
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
  questionnaire_why: string;
  questionnaire_alternatives: string;
  questionnaire_impact: string;
  questionnaire_urgency: string;
  created_at?: string;
  updated_at?: string;
}

// Convert frontend Item to database format
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
    questionnaire_why: item.questionnaire.why,
    questionnaire_alternatives: item.questionnaire.alternatives,
    questionnaire_impact: item.questionnaire.impact,
    questionnaire_urgency: item.questionnaire.urgency,
  };
}

// Convert database format to frontend Item
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
    questionnaire: {
      why: dbItem.questionnaire_why,
      alternatives: dbItem.questionnaire_alternatives,
      impact: dbItem.questionnaire_impact,
      urgency: dbItem.questionnaire_urgency,
    },
  };
}

// Fetch all items for the current user
export async function fetchItems(): Promise<{ items: Item[]; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { items: [], error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      return { items: [], error };
    }

    const items = (data || []).map(dbToItem);
    console.log('✅ Loaded', items.length, 'items from database');
    return { items, error: null };
  } catch (error) {
    console.error('Error fetching items:', error);
    return { items: [], error };
  }
}

// Save a new item to the database
export async function saveItem(item: Item): Promise<{ success: boolean; error: any }> {
  console.log('🔄 Attempting to save item:', item.name);
  console.log('📡 Testing Supabase connection...');
  
  try {
    // Add timeout to getUser call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timed out')), 10000)
    );
    
    const authPromise = supabase.auth.getUser();
    
    console.log('⏳ Waiting for auth response...');
    const { data: { user }, error: authError } = await Promise.race([
      authPromise,
      timeoutPromise
    ]) as any;
    
    console.log('✅ Auth response received');
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: authError };
    }
    
    if (!user) {
      console.error('❌ No user logged in');
      return { success: false, error: new Error('Not authenticated - please log in') };
    }

    console.log('👤 User authenticated:', user.email);
    console.log('🔑 User ID:', user.id);
    
    const dbItem = itemToDb(item, user.id);
    console.log('📝 Prepared database item:', dbItem);
    
    console.log('💾 Attempting database insert...');
    const { error, data } = await supabase
      .from('items')
      .insert([dbItem])
      .select();

    if (error) {
      console.error('❌ Database error saving item:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error };
    }

    console.log('✅ Item saved to database successfully!', data);
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Unexpected error saving item:', error);
    console.error('Error type:', error instanceof Error ? error.message : String(error));
    return { success: false, error };
  }
}

// Update an existing item in the database
export async function updateItem(item: Item): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const dbItem = itemToDb(item, user.id);
    
    const { error } = await supabase
      .from('items')
      .update(dbItem)
      .eq('id', item.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating item:', error);
      return { success: false, error };
    }

    console.log('✅ Item updated in database:', item.name);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating item:', error);
    return { success: false, error };
  }
}

// Delete an item from the database
export async function deleteItem(itemId: string): Promise<{ success: boolean; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting item:', error);
      return { success: false, error };
    }

    console.log('✅ Item deleted from database');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error };
  }
}
