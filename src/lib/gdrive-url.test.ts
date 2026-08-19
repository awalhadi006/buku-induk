import { describe, it, expect } from 'vitest';
import { photoUrl, docUrl } from './gdrive-url';

describe('photoUrl', () => {
  it('returns null for null or undefined', () => {
    expect(photoUrl(null)).toBeNull();
    expect(photoUrl(undefined)).toBeNull();
  });

  it('returns thumbnail URL for gdrive: prefix', () => {
    const url = photoUrl('gdrive:abc123');
    expect(url).toContain('drive.google.com/thumbnail');
    expect(url).toContain('id=abc123');
  });

  it('returns original URL if no gdrive prefix', () => {
    const url = photoUrl('https://example.com/image.jpg');
    expect(url).toBe('https://example.com/image.jpg');
  });
});

describe('docUrl', () => {
  it('returns null for null', () => {
    expect(docUrl(null)).toBeNull();
  });

  it('returns viewer URL for gdrive: prefix', () => {
    const url = docUrl('gdrive:xyz789');
    expect(url).toContain('drive.google.com/file/d/xyz789/view');
  });
});
