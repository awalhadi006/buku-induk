import { describe, it, expect } from 'vitest';
import { parseSidebarNav, DEFAULT_SIDEBAR_ROLES } from './nav';
import { ROLES } from './permissions';

describe('parseSidebarNav', () => {
  it('returns defaults for null or empty input', () => {
    expect(parseSidebarNav(null)).toEqual(DEFAULT_SIDEBAR_ROLES);
    expect(parseSidebarNav('')).toEqual(DEFAULT_SIDEBAR_ROLES);
  });

  it('parses valid JSON and sanitizes roles', () => {
    const input = JSON.stringify({ '/': ['superadmin', 'invalid_role'], '/santri': ['admin_tu'] });
    const result = parseSidebarNav(input);
    expect(result['/']).toContain('superadmin');
    expect(result['/']).not.toContain('invalid_role');
    expect(result['/santri']).toEqual(['admin_tu']);
  });

  it('handles invalid JSON gracefully', () => {
    expect(parseSidebarNav('{invalid')).toEqual(DEFAULT_SIDEBAR_ROLES);
  });
});
