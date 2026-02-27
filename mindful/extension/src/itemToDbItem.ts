import type { Item } from '../../types/item';

/** Transform item to match the webapp's database schema (database.ts / database-alt.ts) */
export function itemToDbItem(item: Omit<Item, 'id' | 'addedDate'>, userId: string) {
  return {
    user_id: userId,
    name: item.name,
    image_url: item.imageUrl || null,
    product_url: item.productUrl || null,
    category: item.category || null,
    constraint_type: item.constraintType,
    consumption_score: item.consumptionScore,
    added_date: new Date().toISOString(),
    wait_until_date: item.waitUntilDate || null,
    difficulty: item.difficulty || null,
    questionnaire: item.questionnaire,
    // Goals-based unlock: friend guardian and password
    friend_name: item.friendName?.trim() || null,
    friend_email: item.friendEmail?.trim() || null,
    unlock_password: item.unlockPassword?.trim() || null,
    is_unlocked: false,
    goal: item.goal?.trim() || item.questionnaire?.find((q) => q.id === 'goal')?.answer?.trim() || null,
  };
}
