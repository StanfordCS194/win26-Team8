import { supabase, DbItem, ItemReflection } from '../lib/supabase';
import { Item } from '../App';

// Reflection question IDs
const REFLECTION_QUESTIONS = {
  why: 'why',
  alternatives: 'alternatives',
  impact: 'impact',
  urgency: 'urgency',
} as const;

// Transform database item + reflections to app item format
export function dbItemToItem(dbItem: DbItem, reflections: ItemReflection[]): Item {
  // Extract reflection responses by question
  const getReflectionResponse = (questionId: string): string => {
    const reflection = reflections.find(r => r.question === questionId);
    return reflection ? String(reflection.response) : '';
  };

  // Determine constraint type and related fields from cost
  // If cost is 0 or null, use time-based, otherwise goals-based
  const constraintType: 'time' | 'goals' = (dbItem.cost && dbItem.cost > 0) ? 'goals' : 'time';
  
  // Calculate consumption score from cost (1-10 scale)
  const consumptionScore = dbItem.cost ? Math.min(Math.max(Math.ceil(dbItem.cost / 10), 1), 10) : 5;
  
  // For time-based: calculate wait date based on score
  let waitUntilDate: string | undefined;
  let difficulty: 'easy' | 'medium' | 'hard' | undefined;
  
  if (constraintType === 'time') {
    const days = consumptionScore * 7;
    const date = new Date(dbItem.created_at);
    date.setDate(date.getDate() + days);
    waitUntilDate = date.toISOString().split('T')[0];
  } else {
    // For goals-based: determine difficulty from score
    difficulty = consumptionScore <= 3 ? 'easy' : consumptionScore <= 7 ? 'medium' : 'hard';
  }

  return {
    id: dbItem.id,
    name: dbItem.name,
    imageUrl: dbItem.image_url || dbItem.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    constraintType,
    consumptionScore,
    addedDate: dbItem.created_at,
    waitUntilDate,
    difficulty,
    questionnaire: {
      why: getReflectionResponse(REFLECTION_QUESTIONS.why),
      alternatives: getReflectionResponse(REFLECTION_QUESTIONS.alternatives),
      impact: getReflectionResponse(REFLECTION_QUESTIONS.impact),
      urgency: getReflectionResponse(REFLECTION_QUESTIONS.urgency),
    },
  };
}

// Transform app item to database format
export function itemToDbItem(item: Omit<Item, 'id' | 'addedDate'>, userId: string): Omit<DbItem, 'id' | 'created_at'> {
  return {
    user_id: userId,
    name: item.name,
    url: null,
    image_url: item.imageUrl,
    cost: item.consumptionScore * 10, // Store consumption score as cost
  };
}

// Create reflection entries with 1-5 ratings
export function createReflectionEntries(itemId: string, questionnaire: Item['questionnaire']) {
  return [
    { item_id: itemId, question: REFLECTION_QUESTIONS.why, response: parseInt(questionnaire.why) || 3 },
    { item_id: itemId, question: REFLECTION_QUESTIONS.alternatives, response: parseInt(questionnaire.alternatives) || 3 },
    { item_id: itemId, question: REFLECTION_QUESTIONS.impact, response: parseInt(questionnaire.impact) || 3 },
    { item_id: itemId, question: REFLECTION_QUESTIONS.urgency, response: parseInt(questionnaire.urgency) || 3 },
  ];
}

// Fetch all items for the current user with their reflections
export async function fetchUserItems(userId: string): Promise<{ data: Item[] | null; error: any }> {
  try {
    // Fetch items
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      return { data: null, error: itemsError };
    }

    if (!itemsData || itemsData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch all reflections for these items
    const itemIds = itemsData.map(item => item.id);
    const { data: reflectionsData, error: reflectionsError } = await supabase
      .from('item_reflections')
      .select('*')
      .in('item_id', itemIds);

    if (reflectionsError) {
      console.error('Error fetching reflections:', reflectionsError);
      // Continue with empty reflections rather than failing completely
    }

    const reflections = reflectionsData || [];

    // Transform items with their reflections
    const items = itemsData.map(dbItem => {
      const itemReflections = reflections.filter(r => r.item_id === dbItem.id);
      return dbItemToItem(dbItem, itemReflections);
    });

    return { data: items, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create a new item with reflections
export async function createItem(
  item: Omit<Item, 'id' | 'addedDate'>,
  userId: string
): Promise<{ data: Item | null; error: any }> {
  try {
    const dbItem = itemToDbItem(item, userId);
    
    // Insert the item
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .insert([dbItem])
      .select()
      .single();

    if (itemError) {
      return { data: null, error: itemError };
    }

    // Insert reflections
    const reflectionEntries = createReflectionEntries(itemData.id, item.questionnaire);
    const { data: reflectionsData, error: reflectionsError } = await supabase
      .from('item_reflections')
      .insert(reflectionEntries)
      .select();

    if (reflectionsError) {
      console.error('Error creating reflections:', reflectionsError);
      // Continue even if reflections fail
    }

    return { data: dbItemToItem(itemData, reflectionsData || []), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update an existing item
export async function updateItem(
  itemId: string,
  updates: Partial<Item>,
  userId: string
): Promise<{ data: Item | null; error: any }> {
  try {
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.consumptionScore !== undefined) dbUpdates.cost = updates.consumptionScore * 10;

    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .update(dbUpdates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (itemError) {
      return { data: null, error: itemError };
    }

    // Update reflections if provided
    if (updates.questionnaire) {
      const reflectionUpdates = createReflectionEntries(itemId, updates.questionnaire);
      
      for (const reflection of reflectionUpdates) {
        await supabase
          .from('item_reflections')
          .upsert({
            item_id: itemId,
            question: reflection.question,
            response: reflection.response,
          }, {
            onConflict: 'item_id,question'
          });
      }
    }

    // Fetch updated reflections
    const { data: reflectionsData } = await supabase
      .from('item_reflections')
      .select('*')
      .eq('item_id', itemId);

    return { data: dbItemToItem(itemData, reflectionsData || []), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete an item and its reflections
export async function deleteItem(itemId: string, userId: string): Promise<{ error: any }> {
  try {
    // Delete reflections first (if they don't have CASCADE)
    await supabase
      .from('item_reflections')
      .delete()
      .eq('item_id', itemId);

    // Delete the item
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
}

// Subscribe to real-time changes for user's items
export function subscribeToUserItems(
  userId: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}

