import { ParsedField } from '../../types/rule';
import { bufferToHex } from '../hex';

const STUN_MSG_TYPES: Record<number, string> = {
  0x0001: 'Binding Request',
  0x0101: 'Binding Response',
  0x0111: 'Binding Error Response',
  0x0002: 'Shared Secret Request',
  0x0102: 'Shared Secret Response',
  0x0112: 'Shared Secret Error Response',
};

const STUN_ATTR_TYPES: Record<number, string> = {
  0x0001: 'MAPPED-ADDRESS',
  0x0006: 'USERNAME',
  0x0008: 'MESSAGE-INTEGRITY',
  0x0009: 'ERROR-CODE',
  0x000A: 'UNKNOWN-ATTRIBUTES',
  0x0020: 'XOR-MAPPED-ADDRESS',
  0x8022: 'SOFTWARE',
  0x8028: 'FINGERPRINT',
};

export function parseStun(data: Uint8Array): ParsedField[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const results: ParsedField[] = [];

  if (data.length < 20) {
    return [{ name: 'Error', rawHex: '', value: null, displayValue: 'Packet too short for STUN header', offset: 0, length: data.length, error: 'Too short' }];
  }

  // Header
  const type = view.getUint16(0, false);
  const length = view.getUint16(2, false);
  const magicCookie = view.getUint32(4, false);
  const transactionId = data.slice(8, 20);

  results.push({
    name: 'Message Type',
    rawHex: bufferToHex(data.slice(0, 2)),
    value: type,
    displayValue: `0x${type.toString(16).padStart(4, '0')} (${STUN_MSG_TYPES[type] || 'Unknown'})`,
    offset: 0,
    length: 2
  });

  results.push({
    name: 'Message Length',
    rawHex: bufferToHex(data.slice(2, 4)),
    value: length,
    displayValue: `${length} bytes`,
    offset: 2,
    length: 2
  });

  results.push({
    name: 'Magic Cookie',
    rawHex: bufferToHex(data.slice(4, 8)),
    value: magicCookie,
    displayValue: `0x${magicCookie.toString(16)}`,
    offset: 4,
    length: 4
  });

  results.push({
    name: 'Transaction ID',
    rawHex: bufferToHex(transactionId),
    value: transactionId,
    displayValue: bufferToHex(transactionId),
    offset: 8,
    length: 12
  });

  // Attributes
  let offset = 20;
  const end = 20 + length;
  
  if (end > data.length) {
     results.push({ name: 'Error', rawHex: '', value: null, displayValue: 'Calculated length exceeds packet size', offset, length: 0, error: 'Length mismatch' });
     return results;
  }

  const attributes: ParsedField = {
    name: 'Attributes',
    rawHex: bufferToHex(data.slice(20, end)),
    value: null,
    displayValue: `${length} bytes`,
    offset: 20,
    length: length,
    children: []
  };

  while (offset < end) {
    if (offset + 4 > end) break;

    const attrType = view.getUint16(offset, false);
    const attrLen = view.getUint16(offset + 2, false);
    const paddedLen = Math.ceil(attrLen / 4) * 4; // Padding to 4 bytes

    if (offset + 4 + attrLen > end) {
       attributes.children?.push({ name: 'Error', rawHex: '', value: null, displayValue: 'Attribute length overflow', offset, length: 0, error: 'Overflow' });
       break;
    }

    const attrValue = data.slice(offset + 4, offset + 4 + attrLen);
    
    attributes.children?.push({
      name: STUN_ATTR_TYPES[attrType] || `Unknown (0x${attrType.toString(16)})`,
      rawHex: bufferToHex(data.slice(offset, offset + 4 + attrLen)), // Show header + value
      value: attrValue,
      displayValue: bufferToHex(attrValue), // TODO: Parse specific attributes like MAPPED-ADDRESS
      offset: offset,
      length: 4 + attrLen
    });

    offset += 4 + paddedLen;
  }

  if (length > 0) {
      results.push(attributes);
  }

  return results;
}
