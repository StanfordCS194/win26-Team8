// Re-export supabase client from env.ts
export { supabase } from '../env';

// Export flag to check if Supabase is configured
export const isSupabaseConfigured = true;

// Database types matching your existing schema
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export interface DbItem {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  image_url: string | null;
  cost: number | null;
  created_at: string;
}

export interface ItemReflection {
  id: string;
  item_id: string;
  question: string;
  response: number; // 1-5 rating scale
  created_at: string;
}

