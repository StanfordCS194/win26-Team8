import { supabase } from '../env';
import type { Item, QuestionAnswer } from '../App';

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
  // Store dynamic questionnaire as JSON in questionnaire_why, others are empty strings
  questionnaire_why: string;
  questionnaire_alternatives: string;
  questionnaire_impact: string;
  questionnaire_urgency: string;
  // Friend unlock fields for goals-based constraints
  friend_name?: string;
  friend_email?: string;
  unlock_password?: string;
  is_unlocked?: boolean;
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
    // Friend unlock fields
    friend_name: item.friendName,
    friend_email: item.friendEmail,
    unlock_password: item.unlockPassword,
    is_unlocked: item.isUnlocked || false,
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

  return {
    id: dbItem.id,
    name: dbItem.name,
    imageUrl: dbItem.image_url,
    constraintType: dbItem.constraint_type,
    consumptionScore: dbItem.consumption_score,
    addedDate: dbItem.added_date,
    waitUntilDate: dbItem.wait_until_date,
    difficulty: dbItem.difficulty,
    questionnaire,
    // Friend unlock fields
    friendName: dbItem.friend_name,
    friendEmail: dbItem.friend_email,
    unlockPassword: dbItem.unlock_password,
    isUnlocked: dbItem.is_unlocked || false,
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

export async function fetchItemForUnlock(itemId: string): Promise<{ name: string; unlockPassword: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('name, unlock_password')
      .eq('id', itemId)
      .single();
    
    if (error || !data) {
      console.error('❌ Fetch error:', error);
      return null;
    }
    
    return {
      name: data.name,
      unlockPassword: data.unlock_password || null,
    };
  } catch (error) {
    console.error('❌ Fetch exception:', error);
    return null;
  }
}

export async function unlockItem(itemId: string, password: string): Promise<{ success: boolean; error: any }> {
  try {
    console.log('🔓 Attempting to unlock item:', itemId);
    
    // First, fetch the item to verify the password
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, unlock_password, is_unlocked')
      .eq('id', itemId)
      .single();
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!items) {
      return { success: false, error: new Error('Item not found') };
    }
    
    if (items.is_unlocked) {
      return { success: false, error: new Error('Item is already unlocked') };
    }
    
    if (items.unlock_password !== password) {
      return { success: false, error: new Error('Incorrect password') };
    }
    
    // Update the item to unlocked
    const { error: updateError } = await supabase
      .from('items')
      .update({ is_unlocked: true })
      .eq('id', itemId);
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('✅ Item unlocked successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Unlock exception:', error);
    return { success: false, error };
  }
}
