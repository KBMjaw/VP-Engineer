import type { SVGProps } from 'react';

/** Inline SVG sprite, rendered once in App. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="i-wa" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
          />
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
        <symbol id="i-phone" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        </symbol>
        <symbol id="i-mail" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </g>
        </symbol>
        <symbol id="i-pin" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </g>
        </symbol>
        <symbol id="i-cal" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="5" width="17" height="15" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </g>
        </symbol>
        <symbol id="i-medal" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="9" r="6" />
            <path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" />
            <path d="m12 6 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
          </g>
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
        </symbol>
        <symbol id="i-close" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
        </symbol>
        <symbol id="i-chev" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
        </symbol>
        <symbol id="i-area" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="1" />
            <path d="M4 9h3M4 14h3M9 4v3M14 4v3" />
          </g>
        </symbol>
        <symbol id="i-retry" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
        </symbol>
      </defs>
    </svg>
  );
}

type IconName = 'wa' | 'arrow' | 'phone' | 'mail' | 'pin' | 'cal' | 'medal' | 'check' | 'close' | 'chev' | 'area' | 'retry';

export function Icon({ name, className = 'ico', ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} aria-hidden="true" focusable="false" {...rest}>
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** Service line icons (64×64). Also reused as portfolio placeholders. */
export function ServiceIcon({ kind, className = 'svc__ico' }: { kind: string; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const body: Record<string, JSX.Element> = {
    residential: (
      <g {...common}>
        <path d="M8 30 32 10l24 20" />
        <path d="M14 26v28h36V26" />
        <path className="acc" d="M27 54V40h10v14" />
        <path d="M19 33h7v6h-7zM38 33h7v6h-7z" />
      </g>
    ),
    commercial: (
      <g {...common}>
        <path d="M12 56V14h26v42" />
        <path d="M38 26h14v30" />
        <path d="M6 56h52" />
        <path className="acc" d="M18 20h4M28 20h4M18 28h4M28 28h4M18 36h4M28 36h4M44 32h3M44 40h3" />
        <path d="M21 56v-9h8v9" />
      </g>
    ),
    industrial: (
      <g {...common}>
        <path d="M6 56V32l12-8v8l12-8v8l12-8v32" />
        <path d="M42 56V12h8v44" />
        <path d="M4 56h56" />
        <path className="acc" d="M12 44h6M24 44h6M34 44h4" />
      </g>
    ),
    structural: (
      <g {...common}>
        <path d="M8 14h48M8 22h48M32 14v8" />
        <path d="M14 22v34M50 22v34M10 56h8M46 56h8" />
        <path className="acc" d="M14 30l36 18M50 30 14 48" />
      </g>
    ),
    renovation: (
      <g {...common}>
        <path d="M10 54V24l22-14 22 14v30z" />
        <path className="acc" d="m24 44 16-16M36 26l6-2-2 6" />
        <path d="m22 46 4-4 2 2-4 4z" />
      </g>
    ),
    estimation: (
      <g {...common}>
        <rect x="14" y="8" width="36" height="48" rx="3" />
        <path d="M20 16h24v8H20z" />
        <path className="acc" d="M21 33h4M30 33h4M39 33h4M21 41h4M30 41h4M39 41h4M21 49h4M30 49h13" />
      </g>
    ),
  };
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      {body[kind] ?? body.residential}
    </svg>
  );
}
