import { describe, it, expect } from 'vitest';
import { cleanHex, formatHex, hexToBuffer, bufferToHex } from './hex';

describe('Hex Utils', () => {
  it('cleanHex should remove non-hex characters', () => {
    expect(cleanHex('12 34')).toBe('1234');
    expect(cleanHex('0x12, 0x34')).toBe('1234');
    expect(cleanHex('AB cd\nEF')).toBe('ABcdEF');
  });

  it('formatHex should add spaces every 2 chars', () => {
    expect(formatHex('1234')).toBe('12 34');
    expect(formatHex('ABC')).toBe('AB C');
  });

  it('hexToBuffer should convert hex string to Uint8Array', () => {
    const buffer = hexToBuffer('1234');
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer[0]).toBe(0x12);
    expect(buffer[1]).toBe(0x34);
  });

  it('hexToBuffer should throw on odd length', () => {
    expect(() => hexToBuffer('123')).toThrow();
  });

  it('bufferToHex should convert buffer to string', () => {
    const buffer = new Uint8Array([0x12, 0x34, 0xAB]);
    expect(bufferToHex(buffer)).toBe('12 34 ab'); // implementation uses lowercase by default from Number.toString(16)
  });
});
