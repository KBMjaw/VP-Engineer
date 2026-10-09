import { describe, expect, it } from 'vitest';
import { fitWithin, validateImageFile } from './images';

describe('fitWithin', () => {
  it('keeps small images unchanged', () => expect(fitWithin(1200, 800, 2400)).toEqual({ width: 1200, height: 800 }));
  it('scales the longest edge down', () => expect(fitWithin(4800, 3200, 2400)).toEqual({ width: 2400, height: 1600 }));
  it('handles portrait photos', () => expect(fitWithin(3000, 4000, 2400)).toEqual({ width: 1800, height: 2400 }));
  it('rejects invalid sizes', () => expect(() => fitWithin(0, 10)).toThrow());
});

describe('validateImageFile', () => {
  const mb = 1024 * 1024;
  it('accepts a JPG under the limit', () => expect(validateImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 3 * mb }, 20)).toBeNull());
  it('rejects non-images', () => expect(validateImageFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 }, 20)).toMatch(/not an image/));
  it('rejects unsupported image formats', () => expect(validateImageFile({ name: 'a.gif', type: 'image/gif', size: 1000 }, 20)).toMatch(/unsupported/));
  it('rejects files over the limit', () => expect(validateImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 25 * mb }, 20)).toMatch(/larger than 20 MB/));
  it('rejects empty files', () => expect(validateImageFile({ name: 'a.jpg', type: 'image/jpeg', size: 0 }, 20)).toMatch(/empty/));
  it('accepts files with no MIME type but an image extension', () => expect(validateImageFile({ name: 'IMG_1.HEIC', type: '', size: 1000 }, 20)).toBeNull());
});
