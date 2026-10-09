import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ requireSupabase: () => { throw new Error('no network in unit tests'); }, IMAGE_BUCKET: 'project-images', SUPABASE_URL: '' }));
import { coverOf, sortImages } from './projects';
import type { Project, ProjectImage } from './types';

const img = (id: string, phase: ProjectImage['phase'], sort_order: number): ProjectImage => ({
  id, phase, sort_order, project_id: 'p', storage_path: `p/${id}.webp`, caption: null, taken_on: null,
  width: null, height: null, size_bytes: null, created_at: '2026-01-01', updated_at: '2026-01-01',
});

describe('sortImages', () => {
  it('orders Before → During → After, then by sort_order', () => {
    const out = sortImages([img('a3', 'after', 0), img('d2', 'during', 1), img('b1', 'before', 0), img('d1', 'during', 0)]);
    expect(out.map((i) => i.id)).toEqual(['b1', 'd1', 'd2', 'a3']);
  });
});

describe('coverOf', () => {
  const base = { cover_image_id: null } as unknown as Project;
  it('uses the chosen cover', () => expect(coverOf({ ...base, cover_image_id: 'd1', project_images: [img('a1', 'after', 0), img('d1', 'during', 0)] })?.id).toBe('d1'));
  it('falls back to the first After photo', () => expect(coverOf({ ...base, project_images: [img('d1', 'during', 0), img('a2', 'after', 1), img('a1', 'after', 0)] })?.id).toBe('a1'));
  it('falls back to the first photo', () => expect(coverOf({ ...base, project_images: [img('d2', 'during', 1), img('b1', 'before', 0)] })?.id).toBe('b1'));
  it('is undefined without photos', () => expect(coverOf({ ...base, project_images: [] })).toBeUndefined());
});
