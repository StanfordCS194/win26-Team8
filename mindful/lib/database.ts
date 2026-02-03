import { supabase } from '../env';
import type { Item } from '../App';

export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  url?: string;
  cost?: number;
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

function itemToDb(item: Item, userId: string): Omit<DbItem, 'created_at' | 'updated_at'> {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl,
    url: undefined,
    cost: undefined,
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

export async function fetchItems(userId: string): Promise<{ items: Item[]; error: any }> {
  try {
    console.log('📥 Fetching items for user:', userId);
    
    // Add timeout
    const fetchPromise = supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timed out after 5 seconds')), 5000)
    );
    
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('❌ Fetch error:', result.error);
      console.error('❌ Error message:', result.error.message);
      console.error('❌ Error details:', result.error.details);
      return { items: [], error: result.error };
    }

    console.log('📦 Raw data from Supabase:', result.data);
    console.log('📊 Number of rows returned:', result.data?.length || 0);
    
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

export async function saveItem(item: Item, userId: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('💾 Saving item:', item.name);
    console.log('👤 User ID:', userId);
    
    const dbItem = itemToDb(item, userId);
    console.log('📝 Database item:', dbItem);
    
    console.log('📡 Sending insert request to Supabase (30 second timeout)...');
    
    // Increase timeout to 30 seconds
    const insertPromise = supabase
      .from('items')
      .insert([dbItem])
      .select();
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Insert timed out after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (result.error) {
      console.error('❌ Save error:', result.error);
      console.error('❌ Error message:', result.error.message);
      console.error('❌ Error details:', result.error.details);
      console.error('❌ Error hint:', result.error.hint);
      console.error('❌ Error code:', result.error.code);
      return { success: false, error: result.error };
    }

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
