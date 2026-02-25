import type { SupabaseClient } from '@supabase/supabase-js';

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
