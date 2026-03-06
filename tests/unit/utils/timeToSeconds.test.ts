import { describe, it, expect } from 'vitest';
import { timeToSeconds } from '../../../src/utils/timeToSeconds.js';

describe('timeToSeconds', () => {
  it('converts HH:MM:SS to seconds', () => {
    expect(timeToSeconds('00:01:30')).toBe(90);
    expect(timeToSeconds('01:00:00')).toBe(3600);
    expect(timeToSeconds('00:00:05')).toBe(5);
  });

  it('handles HH:MM:SS.ms format', () => {
    expect(timeToSeconds('00:01:30.50')).toBe(90.5);
    expect(timeToSeconds('00:00:01.25')).toBe(1.25);
  });

  it('handles MM:SS format', () => {
    expect(timeToSeconds('01:30')).toBe(90);
    expect(timeToSeconds('00:45')).toBe(45);
  });

  it('handles plain number strings', () => {
    expect(timeToSeconds('90')).toBe(90);
    expect(timeToSeconds('90.5')).toBe(90.5);
    expect(timeToSeconds('0')).toBe(0);
  });

  it('passes through numeric values', () => {
    expect(timeToSeconds(90)).toBe(90);
    expect(timeToSeconds(0)).toBe(0);
    expect(timeToSeconds(1.5)).toBe(1.5);
  });

  it('handles whitespace in strings', () => {
    expect(timeToSeconds('  90  ')).toBe(90);
    expect(timeToSeconds(' 00:01:30 ')).toBe(90);
  });
});
