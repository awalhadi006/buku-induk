import { readFile } from 'fs/promises';
import { describe, it, expect } from 'vitest';

const HEADERS_PATH = '/home/ruut/project/buku-induk/_headers';

describe('security-headers _headers file', () => {
  let headersContent: string;

  beforeAll(async () => {
    headersContent = await readFile(HEADERS_PATH, 'utf-8');
  });

  it('contains Content Security Policy directive block', () => {
    expect(headersContent).toContain('Content-Security-Policy:');
    expect(headersContent).toContain("default-src 'self'");
    expect(headersContent).toContain("script-src 'self' 'unsafe-inline'");
    expect(headersContent).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(headersContent).toContain("font-src 'self' https://fonts.gstatic.com data:");
    expect(headersContent).toContain("img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com blob:");
    expect(headersContent).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com");
    expect(headersContent).toContain("frame-src https://accounts.google.com");
    expect(headersContent).toContain("frame-ancestors 'none'");
    expect(headersContent).toContain("form-action 'self'");
    expect(headersContent).toContain("base-uri 'self'");
    expect(headersContent).toContain("object-src 'none'");
    expect(headersContent).toContain("upgrade-insecure-requests");
  });

  it('contains Strict-Transport-Security header', () => {
    expect(headersContent).toContain('Strict-Transport-Security:');
    expect(headersContent).toContain('max-age=31536000');
    expect(headersContent).toContain('includeSubDomains');
    expect(headersContent).toContain('preload');
  });

  it('contains X-Content-Type-Options header', () => {
    expect(headersContent).toContain('X-Content-Type-Options:');
    expect(headersContent).toContain('nosniff');
  });

  it('contains X-Frame-Options header', () => {
    expect(headersContent).toContain('X-Frame-Options:');
    expect(headersContent).toContain('DENY');
  });
});