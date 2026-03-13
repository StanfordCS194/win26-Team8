import { createClient } from '@supabase/supabase-js';
import { chromeStorageAdapter } from './chromeStorageAdapter';

const supabaseUrl = 'https://mohgivduzthccoybnbnr.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaGdpdmR1enRoY2NveWJuYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTA1MDUsImV4cCI6MjA4NTI4NjUwNX0.eoiFJ4fvJnIrV16uwL6Blr2rgMsXwoDE-vNPmY4K4d4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Bypass navigator.locks which hangs in extension popups —
    // the popup can close before the lock is released, causing the
    // next popup open to wait forever.
    lock: (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
  },
});
