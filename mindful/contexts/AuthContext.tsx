import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../env';
import type { User, Session } from '@supabase/supabase-js';

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
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
After 2 seconds, check manual storage for session
This is fallback to get session from storage if auth state change fails for stable UI
*/
function getSessionFromStorage(): Session | null {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { currentSession?: Session; session?: Session } | Session | null;
    const session =
      parsed && typeof parsed === 'object' && 'user' in parsed
        ? (parsed as Session)
        : (parsed as { currentSession?: Session; session?: Session })?.currentSession
          ?? (parsed as { currentSession?: Session; session?: Session })?.session;
    return session?.user ? session : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // used to avoid loading profile multiple times from auth change or fallback
  const profileLoadedForRef = useRef<string | null>(null);

  /* 
  * Fires when users signs in or signs out
  * Sets session, user, and loading state
  * Loads profile if user is signed in
  */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (!newSession?.user) { // if user is signed out, clear profile, and stop loading
        setProfile(null);
        profileLoadedForRef.current = null;
        return;
      }
      if (profileLoadedForRef.current !== newSession.user.id) { // only load profile if it hasn't been loaded yet (avoid infinite loop)
        profileLoadedForRef.current = newSession.user.id;
        loadProfile(newSession.user.id);
      }
    });
    let cancelled = false;
    // fallback to get session from storage if auth state change fails
    const fallback = setTimeout(() => {
      if (cancelled) return;
      // check manual storage for session
      const stored = getSessionFromStorage();
      setSession(stored);
      setUser(stored?.user ?? null);
      setLoading(false);
      if (stored?.user && profileLoadedForRef.current !== stored.user.id) {
        profileLoadedForRef.current = stored.user.id;
        loadProfile(stored.user.id);
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  /*
  * Loads profile from database
  * @param userId - The ID of the user to load the profile for
  */

  const loadProfile = async (userId: string) => {
    try {
      // fetch row from profile tables with matching user id
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) setProfile(data);
    } catch {
      // ignore
    }
  };

  /*
  * Signs up a new user
  * @param email - The email of the user to sign up
  * @param password - The password of the user to sign up
  * @param fullName - The full name of the user to sign up
  */
  const signUp = async (email: string, password: string, fullName: string) => {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    // create auth user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, full_name: fullName },
      },
    });
    if (error) return { error };
    if (data.user) {
      try {
        // insert row into profile table with matching user id
        await supabase.from('profiles').insert([{ id: data.user.id, first_name: firstName, last_name: lastName }]);
      } catch {
        // profile may already exist
      }
    }
    return { error: null };
  };

  /*
  * Signs in a user
  * @param email - The email of the user to sign in
  * @param password - The password of the user to sign in
  */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  /*
  * Signs out a user
  */
  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    profileLoadedForRef.current = null;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('secondThought_')) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    // Supabase removes its auth token from storage when signing out
    // onAuthStateChange will fire again with a null session
    await supabase.auth.signOut();
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
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
