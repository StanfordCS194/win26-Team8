import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeProductUrl } from './urlUtils';

/**
 * Fetch product_url values for a user (for duplicate-URL check).
 * Accepts any Supabase client so the extension can pass its own client.
 */
export async function fetchUserProductUrlsWithClient(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<{ urls: string[]; error: any }> {
  try {
    const { data, error } = await supabaseClient
      .from('items')
      .select('product_url')
      .eq('user_id', userId)
      .not('product_url', 'is', null);

    if (error) return { urls: [], error };
    const urls = (data || [])
      .map((r: { product_url: string | null }) => r.product_url)
      .filter(Boolean) as string[];
    return { urls, error: null };
  } catch (error) {
    return { urls: [], error };
  }
}

export interface ItemByProductUrl {
  wait_until_date: string | null;
  friend_name: string | null;
  is_unlocked: boolean | null;
}

/**
 * Fetch the item (product_url, wait_until_date, friend_name, is_unlocked) for a user that matches the given page URL.
 * Uses same URL normalization as duplicate check. For extension banner (locked vs unlocked).
 */
export async function fetchItemByProductUrlWithClient(
  supabaseClient: SupabaseClient,
  userId: string,
  pageUrl: string
): Promise<{ item: ItemByProductUrl | null; error: any }> {
  try {
    const { data, error } = await supabaseClient
      .from('items')
      .select('product_url, wait_until_date, friend_name, is_unlocked')
      .eq('user_id', userId)
      .not('product_url', 'is', null);

    if (error) return { item: null, error };
    const rows = (data || []) as {
      product_url: string | null;
      wait_until_date: string | null;
      friend_name: string | null;
      is_unlocked: boolean | null;
    }[];
    const normalizedPage = normalizeProductUrl(pageUrl);
    const match = rows.find(
      (r) => r.product_url && normalizeProductUrl(r.product_url) === normalizedPage
    );
    if (!match) return { item: null, error: null };
    return {
      item: {
        wait_until_date: match.wait_until_date,
        friend_name: match.friend_name,
        is_unlocked: match.is_unlocked,
      },
      error: null,
    };
  } catch (error) {
    return { item: null, error };
  }
}
