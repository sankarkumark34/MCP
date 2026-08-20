import { describe, expect, it } from 'vitest';
import { apiErrorMessage, formatDateTime } from './format';

describe('formatDateTime', () => {
  it('returns a dash for null/invalid input', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('formats a valid ISO date', () => {
    expect(formatDateTime('2026-08-20T04:30:00Z')).not.toBe('—');
  });
});

describe('apiErrorMessage', () => {
  it('joins array messages from class-validator', () => {
    expect(apiErrorMessage({ data: { message: ['a', 'b'] } })).toBe('a; b');
  });

  it('passes through string messages', () => {
    expect(apiErrorMessage({ data: { message: 'Invalid group' } })).toBe('Invalid group');
  });

  it('falls back to a generic message', () => {
    expect(apiErrorMessage({})).toBe('Request failed. Please try again.');
  });
});
