import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mohgivduzthccoybnbnr.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4";

// Validate Supabase key format
console.log('🔑 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
console.log('🔑 Key starts with "eyJ"?', supabaseAnonKey.startsWith('eyJ'));

if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ INVALID SUPABASE KEY!');
  console.error('Your anon key should start with "eyJ" and be very long (JWT token).');
  console.error('Current key starts with:', supabaseAnonKey.substring(0, 20));
  console.error('Get your real key from: https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api');
} else {
  console.log('✅ Supabase key format looks valid!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
