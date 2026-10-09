import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'dark' | 'ghost' | 'danger' | 'subtle';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-ink hover:bg-brand-dark',
  dark: 'bg-ink text-white hover:bg-black',
  ghost: 'border border-line bg-white text-ink hover:border-ink',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  subtle: 'bg-paper text-ink hover:bg-line',
};

export function btn(variant: Variant = 'dark', extra = '') {
  return `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;
}

export function Button({ variant = 'dark', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...rest} className={btn(variant, className)} />;
}

export function Field({ label, hint, children, required, htmlFor }: { label: string; hint?: string; children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
        {label}
        {required ? <span className="text-red-600"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border border-[#d9d9d9] bg-white px-3.5 py-3 text-[16px] text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-brand/40 disabled:bg-paper';

export function Notice({ kind = 'info', children, onClose }: { kind?: 'info' | 'success' | 'error' | 'warn'; children: ReactNode; onClose?: () => void }) {
  const cls = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warn: 'border-amber-300 bg-amber-50 text-amber-900',
  }[kind];
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${cls}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div>{children}</div>
      {onClose && (
        <button onClick={onClose} className="-m-1 p-1 text-lg leading-none opacity-60 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

export function Badge({ tone, children }: { tone: 'green' | 'grey' | 'yellow' | 'blue'; children: ReactNode }) {
  const cls = {
    green: 'bg-emerald-100 text-emerald-800',
    grey: 'bg-paper text-muted',
    yellow: 'bg-brand/30 text-ink',
    blue: 'bg-sky-100 text-sky-800',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      {label}…
    </div>
  );
}
