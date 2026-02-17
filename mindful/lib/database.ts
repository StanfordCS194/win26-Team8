import { supabase } from '../env';
import type { Item, ItemCategory, QuestionAnswer } from '../types/item';

export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  category?: string;
  url?: string;
  cost?: number;
  constraint_type: 'time' | 'goals';
  consumption_score: number;
  added_date: string;
  wait_until_date?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Store dynamic questionnaire as JSON in questionnaire_why, others are empty strings
  questionnaire_why: string;
  questionnaire_alternatives: string;
  questionnaire_impact: string;
  questionnaire_urgency: string;
  created_at?: string;
  updated_at?: string;
}

function itemToDb(item: Item, userId: string): Omit<DbItem, 'created_at' | 'updated_at'> {
  // Serialize the dynamic questionnaire array as JSON
  const questionnaireJson = JSON.stringify(item.questionnaire);

  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl,
    category: item.category,
    url: undefined,
    cost: undefined,
    constraint_type: item.constraintType,
    consumption_score: item.consumptionScore,
    added_date: item.addedDate,
    wait_until_date: item.waitUntilDate,
    difficulty: item.difficulty,
    // Store JSON in questionnaire_why, use empty strings for others
    questionnaire_why: questionnaireJson,
    questionnaire_alternatives: '',
    questionnaire_impact: '',
    questionnaire_urgency: '',
  };
}

function dbToItem(dbItem: DbItem): Item {
  // Try to parse questionnaire_why as JSON array (new format)
  // Fall back to old fixed format if parsing fails
  let questionnaire: QuestionAnswer[];

  try {
    const parsed = JSON.parse(dbItem.questionnaire_why);
    if (Array.isArray(parsed)) {
      questionnaire = parsed;
    } else {
      // Old format - convert to new format
      questionnaire = [
        { id: 'why', question: 'Why do you want this item?', answer: dbItem.questionnaire_why },
        { id: 'alternatives', question: 'What alternatives have you considered?', answer: dbItem.questionnaire_alternatives },
        { id: 'impact', question: 'What impact will this have?', answer: dbItem.questionnaire_impact },
        { id: 'urgency', question: 'How urgent is this purchase?', answer: dbItem.questionnaire_urgency },
      ];
    }
  } catch {
    // Not JSON - use old fixed format
    questionnaire = [
      { id: 'why', question: 'Why do you want this item?', answer: dbItem.questionnaire_why },
      { id: 'alternatives', question: 'What alternatives have you considered?', answer: dbItem.questionnaire_alternatives },
      { id: 'impact', question: 'What impact will this have?', answer: dbItem.questionnaire_impact },
      { id: 'urgency', question: 'How urgent is this purchase?', answer: dbItem.questionnaire_urgency },
    ];
  }

  const category = dbItem.category as ItemCategory | undefined;
  return {
    id: dbItem.id,
    name: dbItem.name,
    imageUrl: dbItem.image_url,
    category: category && ['Beauty', 'Clothes', 'Sports', 'Electronics', 'Home', 'Other'].includes(category) ? category : undefined,
    constraintType: dbItem.constraint_type,
    consumptionScore: dbItem.consumption_score,
    addedDate: dbItem.added_date,
    waitUntilDate: dbItem.wait_until_date,
    difficulty: dbItem.difficulty,
    questionnaire,
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
