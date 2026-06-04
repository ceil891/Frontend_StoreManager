import { describe, it, expect } from 'vitest';

describe('currency formatting (vi-VN)', () => {
  it('formats large integer to vi-VN with ₫ suffix', () => {
    const value = 2500000;
    const formatted = value.toLocaleString('vi-VN') + '₫';
    expect(formatted.endsWith('₫')).toBe(true);
    expect(formatted).toContain('2.500.000');
  });

  it('formats zero and small decimals without throwing', () => {
    const zero = (0).toLocaleString('vi-VN') + '₫';
    expect(zero).toBeDefined();

    const val = 1234.5;
    const formatted = val.toLocaleString('vi-VN') + '₫';
    expect(formatted).toContain('1.234');
    expect(formatted.endsWith('₫')).toBe(true);
  });
});
