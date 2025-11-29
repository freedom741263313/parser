import { describe, it, expect } from 'vitest';
import { parseStun } from '../../../utils/protocols/stun';
import { hexToBuffer } from '../../../utils/hex';

describe('STUN Parser', () => {
  it('should parse standard Binding Request', () => {
    // Header: 0001 (Type), 0000 (Length), 2112A442 (Magic Cookie), ...TransactionID
    const hex = "00 01 00 00 21 12 A4 42 B7 E7 A7 01 BC 34 D6 86 FA 87 DF AE";
    const buffer = hexToBuffer(hex);
    const results = parseStun(buffer);

    expect(results[0].name).toBe('Message Type');
    expect(results[0].value).toBe(0x0001); // Binding Request
    expect(results[1].name).toBe('Message Length');
    expect(results[1].value).toBe(0);
    expect(results[2].name).toBe('Magic Cookie');
    expect(results[2].value).toBe(0x2112A442);
  });

  it('should detect short packets', () => {
    const buffer = new Uint8Array([0x00]);
    const results = parseStun(buffer);
    expect(results[0].error).toBe('Too short');
  });
});
