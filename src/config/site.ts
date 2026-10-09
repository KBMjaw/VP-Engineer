/** Company details — edit here, used across the whole site. */
export const SITE = {
  name: 'VP Engineer',
  tagline: 'Versatile In Profession',
  proprietor: 'J. Tamil Selvan',
  proprietorTitle: 'M.E. (Structural Engineering)',
  qualifications: [
    { level: 'Diploma', name: 'Civil Engineering' },
    { level: 'B.E.', name: 'Civil Engineering' },
    { level: 'M.E.', name: 'Structural Engineering' },
  ],
  experienceYears: 12,
  founded: 2015,
  location: 'Erode, Tamil Nadu',
  country: 'India',
  phoneDisplay: '+91 79041 32387',
  phoneE164: '+917904132387',
  whatsapp: 'https://wa.me/917904132387',
  email: 'vpengineerserd@gmail.com',
  /** Optional Google Maps link for the office. Leave empty to hide the map link. */
  mapUrl: '',
  url: 'https://vp-engineers.vercel.app',
  developer: { name: 'Cube Corpsol', url: 'https://cubecorpsol.com' },
} as const;

export const CATEGORIES = [
  { key: 'residential', label: 'Residential', service: 'Residential Construction' },
  { key: 'commercial', label: 'Commercial', service: 'Commercial Construction' },
  { key: 'industrial', label: 'Industrial', service: 'Industrial Construction' },
  { key: 'structural', label: 'Structural Works', service: 'Structural Engineering & Works' },
  { key: 'renovation', label: 'Repair & Renovation', service: 'Repair & Renovation' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const PHASES = [
  { key: 'before', label: 'Before' },
  { key: 'during', label: 'During' },
  { key: 'after', label: 'After' },
] as const;
export type PhaseKey = (typeof PHASES)[number]['key'];

export const PROJECT_STATUSES = [
  { key: 'planning', label: 'Planning' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
] as const;
export type ProjectStatusKey = (typeof PROJECT_STATUSES)[number]['key'];

export const AREA_UNITS = [
  { key: 'sq_ft', label: 'sq. ft.' },
  { key: 'sq_m', label: 'sq. m.' },
  { key: 'acres', label: 'acres' },
  { key: 'cents', label: 'cents' },
  { key: 'grounds', label: 'grounds' },
  { key: 'hectares', label: 'hectares' },
] as const;
export type AreaUnitKey = (typeof AREA_UNITS)[number]['key'];

export function labelOf<T extends readonly { key: string; label: string }[]>(list: T, key: string | null | undefined) {
  return list.find((x) => x.key === key)?.label ?? '';
}

/** Max photo size the admin can pick (before compression), from VITE_MAX_UPLOAD_MB. */
export const MAX_UPLOAD_MB = Math.max(1, Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 20);
