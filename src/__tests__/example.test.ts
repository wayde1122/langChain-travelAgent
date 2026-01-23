import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello, Travel Assistant!';
    expect(greeting).toContain('Travel');
  });
});
