import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mohgivduzthccoybnbnr.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4";

console.log('🔑 Supabase initialized');
console.log('📍 URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
