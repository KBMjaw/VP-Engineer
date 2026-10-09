import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AdminStatus = 'checking' | 'admin' | 'not-admin' | 'error';

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  adminStatus: AdminStatus;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  recheck: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

/**
 * Session + admin authorization. Admin status comes from the admin_users table
 * (RLS lets a user read only their own row) — the database enforces the same
 * rule on every write via public.is_admin(), so this check is for UX only.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>('checking');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase || !userId) {
      setAdminStatus('checking');
      return;
    }
    let cancelled = false;
    setAdminStatus('checking');
    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setAdminStatus('error');
        else setAdminStatus(data ? 'admin' : 'not-admin');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, nonce]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Supabase is not configured.';
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return null;
    if (/invalid login credentials/i.test(error.message)) return 'Incorrect email or password.';
    if (/email not confirmed/i.test(error.message)) return 'This email address has not been confirmed yet.';
    if (/rate limit|too many/i.test(error.message)) return 'Too many attempts. Please wait a minute and try again.';
    return error.message;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return (
    <Ctx.Provider value={{ session, loading, adminStatus, signIn, signOut, recheck: () => setNonce((n) => n + 1) }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
