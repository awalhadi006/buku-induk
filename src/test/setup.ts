import { expect, vi } from 'vitest';
import * as matchers from '@chialab/vitest-axe';
import axe from 'axe-core';

expect.extend(matchers);
global.axe = axe;

// Mock Svelte lifecycle functions for jsdom/happy-dom environment
vi.mock('svelte', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    onMount: vi.fn((fn) => fn()),
    onDestroy: vi.fn(),
    beforeUpdate: vi.fn((fn) => fn()),
    afterUpdate: vi.fn((fn) => fn()),
    tick: vi.fn(() => Promise.resolve()),
    setContext: vi.fn(),
    getContext: vi.fn(),
    getAllContexts: vi.fn(() => ({})),
  };
});

// Mock $app/state
vi.mock('$app/state', () => ({
  page: { url: new URL('http://localhost/') },
  navigating: null,
  updated: null,
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(() => Promise.resolve()),
  invalidate: vi.fn(() => Promise.resolve()),
  invalidateAll: vi.fn(() => Promise.resolve()),
}));

// Mock $lib/supabase
vi.mock('$lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

// Mock $lib/gdrive-url
vi.mock('$lib/gdrive-url', () => ({
  photoUrl: vi.fn((url) => url),
}));