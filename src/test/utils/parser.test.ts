import { describe, it, expect } from 'vitest';
import { ParserEngine } from '../../utils/parser';
import { ProtocolRule } from '../../types/rule';

describe('ParserEngine', () => {
  const engine = new ParserEngine();

  it('should parse uint8 and uint16 big endian', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    const rule: ProtocolRule = {
      id: 'test', name: 'Test', type: 'custom',
      fields: [
        { id: 'f1', name: 'F1', length: 1, type: 'uint8', endianness: 'be', algorithm: 'default' },
        { id: 'f2', name: 'F2', length: 2, type: 'uint16', endianness: 'be', algorithm: 'default' }
      ]
    };

    const results = engine.parse(data, rule);
    expect(results).toHaveLength(2);
    expect(results[0].value).toBe(1);
    expect(results[1].value).toBe(0x0203); // 515
  });

  it('should parse little endian', () => {
    const data = new Uint8Array([0x03, 0x02]); // 0x0203
    const rule: ProtocolRule = {
      id: 'test', name: 'Test', type: 'custom',
      fields: [
        { id: 'f1', name: 'F1', length: 2, type: 'uint16', endianness: 'le', algorithm: 'default' }
      ]
    };
    const results = engine.parse(data, rule);
    expect(results[0].value).toBe(515);
  });

  it('should handle insufficient data', () => {
    const data = new Uint8Array([0x01]);
    const rule: ProtocolRule = {
      id: 'test', name: 'Test', type: 'custom',
      fields: [
        { id: 'f1', name: 'F1', length: 2, type: 'uint16', endianness: 'be', algorithm: 'default' }
      ]
    };
    const results = engine.parse(data, rule);
    expect(results[0].error).toBeDefined();
  });

  it('should parse string', () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('Hello');
    const rule: ProtocolRule = {
      id: 'test', name: 'Test', type: 'custom',
      fields: [
        { id: 'f1', name: 'Str', length: 5, type: 'string', endianness: 'be', algorithm: 'default' }
      ]
    };
    const results = engine.parse(data, rule);
    expect(results[0].value).toBe('Hello');
  });
});
