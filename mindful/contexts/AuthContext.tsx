import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../env';
import type { User, Session } from '@supabase/supabase-js';

/** Supabase stores session here; we read it when getSession() times out. */
const SUPABASE_STORAGE_KEY = 'sb-mohgivduzthccoybnbnr-auth-token';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  /** Set when onAuthStateChange fires SIGNED_IN so we can treat timeout as success */
  const signedInAtRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔐 Initializing auth...');
    
    // Get initial session. Supabase's getSession() can hang on slow/flaky networks,
    // so we use a timeout and fall back to reading the session from localStorage.
    const checkSession = async () => {
      let session: Session | null = null;
      try {
        const timeoutMs = 10000; // 10s
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), timeoutMs)
        );
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as { data: { session: Session | null } };
        session = data?.session ?? null;
      } catch (err) {
        console.warn('⚠️ Session check failed (showing login):', err);
        // getSession() timed out or failed - try localStorage fallback
        try {
          const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { currentSession?: Session; session?: Session } | Session | null;
            const fromStorage =
              parsed && typeof parsed === 'object' && 'user' in parsed
                ? (parsed as Session)
                : (parsed as { currentSession?: Session; session?: Session })?.currentSession
                  ?? (parsed as { currentSession?: Session; session?: Session })?.session;
            if (fromStorage?.user) {
              session = fromStorage;
              console.log('📱 Restored session from localStorage (getSession timed out)');
            }
          }
        } catch (_) {
          // Ignore localStorage parse errors
        }
      }
      console.log('📱 Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          signedInAtRef.current = Date.now();
        }
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('👤 Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('⚠️ Profile load error:', error.message);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded');
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ Unexpected profile error:', err);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Signing up...');
      
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Signup timeout after 10 seconds')), 10000)
      );

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
          },
        },
      });

      const { data, error: signUpError } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]) as any;

      if (signUpError) {
        console.error('❌ Signup error:', signUpError);
        return { error: signUpError };
      }

      if (data.user) {
        console.log('✅ User created');
        
        // Create profile with timeout
        const profilePromise = supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
          }]);

        const profileTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile creation timeout')), 5000)
        );

        const { error: profileError } = await Promise.race([
          profilePromise,
          profileTimeout
        ]) as any;

        if (profileError) {
          console.warn('⚠️ Profile creation error:', profileError);
        }
      }

      return { error: null };
    } catch (err) {
      console.error('❌ Signup exception:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in...');
      
      const timeoutMs = 15000; // 15s so slow networks can complete
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign in timeout after 15 seconds')), timeoutMs)
      );

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      const { error } = result ?? {};
      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }

      console.log('✅ Signed in');
      return { error: null };
    } catch (err) {
      // Timeout can fire even when auth succeeded (onAuthStateChange already fired SIGNED_IN)
      const signedInAt = signedInAtRef.current;
      if (signedInAt != null && Date.now() - signedInAt < 20000) {
        console.log('✅ Signed in (SIGNED_IN received before timeout)');
        return { error: null };
      }
      console.error('❌ Sign in exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      signedInAtRef.current = null;
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.clear();
      
      await supabase.auth.signOut();
      
      window.location.reload();
    } catch (err) {
      console.error('❌ Sign out error:', err);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
