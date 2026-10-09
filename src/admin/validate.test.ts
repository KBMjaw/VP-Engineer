import { describe, expect, it, vi } from 'vitest';
vi.mock('../lib/supabase', () => ({ requireSupabase: () => { throw new Error('no network'); }, supabase: null, supabaseConfigured: false, IMAGE_BUCKET: 'x', SUPABASE_URL: '' }));
import { validateForm } from './ProjectEditor';

const ok = {
  title: ' Villa ', category: 'residential', site_type: '', description: '', location: ' Erode ', address: '', maps_url: '',
  site_area: '2,400', built_up_area: '', area_unit: 'sq_ft', client_reference: '', start_date: '', completion_date: '', project_status: 'planning',
} as const;

describe('validateForm', () => {
  it('trims text and turns blanks into null', () => {
    const { input } = validateForm({ ...ok });
    expect(input).toMatchObject({ title: 'Villa', location: 'Erode', site_type: null, site_area: 2400, built_up_area: null, start_date: null });
  });
  it('requires a title and category', () => {
    const { errors, input } = validateForm({ ...ok, title: '  ', category: '' });
    expect(input).toBeUndefined();
    expect(errors.title).toBeTruthy();
    expect(errors.category).toBeTruthy();
  });
  it('only accepts https map links', () => {
    expect(validateForm({ ...ok, maps_url: 'javascript:alert(1)' }).errors.maps_url).toBeTruthy();
    expect(validateForm({ ...ok, maps_url: 'https://maps.app.goo.gl/abc' }).input?.maps_url).toBe('https://maps.app.goo.gl/abc');
  });
  it('rejects negative areas and reversed dates', () => {
    expect(validateForm({ ...ok, built_up_area: '-5' }).errors.built_up_area).toBeTruthy();
    expect(validateForm({ ...ok, start_date: '2026-05-01', completion_date: '2026-01-01' }).errors.completion_date).toBeTruthy();
  });
});
