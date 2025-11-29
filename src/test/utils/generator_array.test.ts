import { describe, it, expect } from 'vitest';
import { PacketGenerator } from '../../utils/generator';
import { ProtocolRule, FieldDefinition } from '../../types/rule';

describe('PacketGenerator Array Support', () => {
  const generator = new PacketGenerator();

  it('should generate byte array from semicolon-separated IP strings (longToIp)', () => {
    const field: FieldDefinition = {
      id: 'ip_list',
      name: 'IP List',
      type: 'array',
      length: 4,
      endianness: 'be',
      algorithm: 'longToIp',
      offset: 0
    };

    const rule: ProtocolRule = {
      id: 'test_rule',
      name: 'Test Rule',
      type: 'custom',
      fields: [field]
    };

    const values = {
      'ip_list': '192.168.1.1; 10.0.0.1'
    };

    // 192.168.1.1 -> C0 A8 01 01
    // 10.0.0.1    -> 0A 00 00 01
    const expected = 'c0 a8 01 01 0a 00 00 01';
    expect(generator.generate(rule, values)).toBe(expected);
  });

  it('should generate byte array from semicolon-separated numbers (uint8)', () => {
    const field: FieldDefinition = {
      id: 'nums',
      name: 'Numbers',
      type: 'array',
      length: 1,
      endianness: 'be',
      algorithm: 'uint8',
      offset: 0
    };

    const rule: ProtocolRule = {
      id: 'test_rule',
      name: 'Test Rule',
      type: 'custom',
      fields: [field]
    };

    const values = {
      'nums': '10; 20; 30; 255'
    };

    // 10 -> 0A, 20 -> 14, 30 -> 1E, 255 -> FF
    const expected = '0a 14 1e ff';
    expect(generator.generate(rule, values)).toBe(expected);
  });

  it('should generate byte array from semicolon-separated numbers (uint16 le)', () => {
    const field: FieldDefinition = {
      id: 'nums',
      name: 'Numbers',
      type: 'array',
      length: 2,
      endianness: 'le',
      algorithm: 'uint16',
      offset: 0
    };

    const rule: ProtocolRule = {
      id: 'test_rule',
      name: 'Test Rule',
      type: 'custom',
      fields: [field]
    };

    const values = {
      'nums': '1000; 2000'
    };

    // 1000 -> 03E8 -> E8 03
    // 2000 -> 07D0 -> D0 07
    const expected = 'e8 03 d0 07';
    expect(generator.generate(rule, values)).toBe(expected);
  });

  it('should fallback to hex parsing for unknown format string in array', () => {
      // If algorithm is default/hexStr, it should treat items as hex
      const field: FieldDefinition = {
        id: 'hex_list',
        name: 'Hex List',
        type: 'array',
        length: 2,
        endianness: 'be',
        algorithm: 'default',
        offset: 0
      };
  
      const rule: ProtocolRule = {
        id: 'test_rule',
        name: 'Test Rule',
        type: 'custom',
        fields: [field]
      };
  
      const values = {
        'hex_list': 'AABB; CCDD'
      };
  
      const expected = 'aa bb cc dd';
      expect(generator.generate(rule, values)).toBe(expected);
    });

    it('should treat byte type as raw hex string (ignoring spaces)', () => {
        const field: FieldDefinition = {
          id: 'raw_bytes',
          name: 'Raw Bytes',
          type: 'byte',
          length: 4,
          endianness: 'be',
          algorithm: 'default',
          offset: 0
        };
    
        const rule: ProtocolRule = {
          id: 'test_rule',
          name: 'Test Rule',
          type: 'custom',
          fields: [field]
        };
    
        const values = {
          'raw_bytes': 'AA BB CC DD'
        };
    
        // byte type should strip spaces and use hexToBuffer directly
        const expected = 'aa bb cc dd';
        expect(generator.generate(rule, values)).toBe(expected);
      });
});
