import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Button, Field, Notice, Spinner, btn, inputCls } from './ui';
import { SITE } from '../config/site';
import { supabase, supabaseConfigured } from '../lib/supabase';

function useNoIndex(title: string) {
  useEffect(() => {
    document.title = `${title} · ${SITE.name} Admin`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, [title]);
}

function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  useNoIndex(title);
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10 font-body">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <img src="/img/vp-logo-96.png" alt="" className="h-11 w-auto" />
          <span>
            <span className="block font-head text-lg font-extrabold">{SITE.name}</span>
            <span className="block text-xs text-muted">Admin</span>
          </span>
        </Link>
        <h1 className="mb-6 font-head text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <AuthCard title="Setup required">
      <Notice kind="warn">
        The admin panel needs Supabase. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in the hosting environment and redeploy. See docs/SUPABASE_SETUP.md.
      </Notice>
    </AuthCard>
  );
}

export function LoginPage() {
  const { session, adminStatus, signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!supabaseConfigured) return <NotConfigured />;
  if (session && adminStatus === 'admin') return <Navigate to={(loc.state as { from?: string } | null)?.from ?? '/admin'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err);
    else nav((loc.state as { from?: string } | null)?.from ?? '/admin', { replace: true });
  };

  return (
    <AuthCard title="Sign in">
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="Email" required htmlFor="email">
          <input id="email" type="email" autoComplete="username" inputMode="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" required htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" variant="dark" disabled={busy || !email || !password} className="mt-2 w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <Link to="/admin/forgot-password" className="text-center text-sm text-muted underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  if (!supabaseConfigured) return <NotConfigured />;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('busy');
    setError(null);
    const base = (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${base}/admin/reset-password` });
    if (error) {
      setError(error.message);
      setState('idle');
    } else setState('sent');
  };
  return (
    <AuthCard title="Reset password">
      {state === 'sent' ? (
        <Notice kind="success">If that email belongs to an account, a reset link is on its way. Open it on this device.</Notice>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          {error && <Notice kind="error">{error}</Notice>}
          <Field label="Email" required htmlFor="femail">
            <input id="femail" type="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={state === 'busy' || !email}>
            {state === 'busy' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <Link to="/admin/login" className="mt-5 block text-center text-sm text-muted hover:underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!supabaseConfigured) return <NotConfigured />;
  if (loading) return <AuthCard title="Set a new password"><Spinner /></AuthCard>;
  if (!session)
    return (
      <AuthCard title="Set a new password">
        <Notice kind="warn">This reset link is invalid or has expired. Request a new one.</Notice>
        <Link to="/admin/forgot-password" className={btn('dark', 'mt-5 w-full')}>
          Request new link
        </Link>
      </AuthCard>
    );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return setError('Use at least 10 characters.');
    if (pw !== pw2) return setError('The two passwords do not match.');
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setError(error.message);
    else nav('/admin', { replace: true });
  };
  return (
    <AuthCard title="Set a new password">
      <form onSubmit={submit} className="grid gap-4">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="New password" required htmlFor="np" hint="At least 10 characters.">
          <input id="np" type="password" autoComplete="new-password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Confirm password" required htmlFor="np2">
          <input id="np2" type="password" autoComplete="new-password" className={inputCls} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </AuthCard>
  );
}

/** Route guard + layout for every signed-in admin page. */
export function AdminLayout() {
  const { session, loading, adminStatus, signOut, recheck } = useAuth();
  const loc = useLocation();
  useNoIndex('Admin');

  if (!supabaseConfigured) return <NotConfigured />;
  if (loading) return <AuthCard title="Admin"><Spinner /></AuthCard>;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  if (adminStatus === 'checking') return <AuthCard title="Admin"><Spinner label="Checking access" /></AuthCard>;
  if (adminStatus === 'error')
    return (
      <AuthCard title="Connection problem">
        <Notice kind="error">We couldn’t verify your access. Check your connection.</Notice>
        <div className="mt-5 flex gap-3">
          <Button onClick={recheck}>Retry</Button>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </AuthCard>
    );
  if (adminStatus === 'not-admin')
    return (
      <AuthCard title="Access denied">
        <Notice kind="error">
          <strong>{session.user.email}</strong> is signed in but is not an administrator of this website.
        </Notice>
        <Button className="mt-5 w-full" onClick={signOut}>
          Sign out
        </Button>
      </AuthCard>
    );

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-paper'}`;

  return (
    <div className="min-h-screen bg-[#fafafa] font-body text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/img/vp-logo-96.png" alt="" className="h-9 w-auto" />
            <span className="font-head text-base font-extrabold">
              {SITE.name} <span className="font-normal text-muted">Admin</span>
            </span>
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Admin">
            <NavLink to="/admin" end className={link}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/projects" end className={link}>
              Projects
            </NavLink>
            <NavLink to="/admin/projects/new" className={link}>
              + New project
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden text-sm text-muted hover:text-ink sm:inline">
              View site ↗
            </a>
            <span className="hidden max-w-[180px] truncate text-xs text-muted md:inline" title={session.user.email}>
              {session.user.email}
            </span>
            <button onClick={signOut} className={btn('ghost', 'min-h-[38px] px-4')}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
