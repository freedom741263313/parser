import { ProtocolRule, FieldDefinition } from '../types/rule';
import { bufferToHex, hexToBuffer } from './hex';

export class PacketGenerator {
  generate(rule: ProtocolRule, values: Record<string, any>): string {
    const buffers: Uint8Array[] = [];

    for (const field of rule.fields) {
      const value = values[field.id];
      buffers.push(this.generateField(field, value));
    }

    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
    const finalBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      finalBuffer.set(buf, offset);
      offset += buf.length;
    }

    return bufferToHex(finalBuffer);
  }

  private generateElement(field: FieldDefinition, item: any): Uint8Array {
    const chunk = new Uint8Array(field.length);
    const view = new DataView(chunk.buffer);
    const isLE = field.endianness === 'le';

    try {
        if (field.algorithm === 'longToIp' && typeof item === 'string') {
           const parts = item.split('.').map(Number);
           if (parts.length === 4) {
               const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
               view.setUint32(0, ipNum, isLE); // IP is usually BE, but respect field config
           }
        } else if (field.algorithm === 'c_string' || field.algorithm === 'utf8') {
           const encoder = new TextEncoder();
           const strBytes = encoder.encode(String(item));
           const copyLen = Math.min(strBytes.length, field.length);
           chunk.set(strBytes.subarray(0, copyLen));
        } else if (['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64'].includes(field.algorithm)) {
            const num = Number(item);
            if (!isNaN(num)) {
                switch (field.algorithm) {
                    case 'int8': view.setInt8(0, num); break;
                    case 'uint8': view.setUint8(0, num); break;
                    case 'int16': view.setInt16(0, num, isLE); break;
                    case 'uint16': view.setUint16(0, num, isLE); break;
                    case 'int32': view.setInt32(0, num, isLE); break;
                    case 'uint32': view.setUint32(0, num, isLE); break;
                    case 'int64': view.setBigInt64(0, BigInt(item), isLE); break;
                    case 'uint64': view.setBigUint64(0, BigInt(item), isLE); break;
                }
            }
        } else if (typeof item === 'number') {
           if (field.length === 1) view.setUint8(0, item);
           else if (field.length === 2) view.setUint16(0, item, isLE);
           else if (field.length === 4) view.setUint32(0, item, isLE);
           else if (field.length === 8) view.setBigUint64(0, BigInt(item), isLE);
        } else if (typeof item === 'string') {
           const bytes = hexToBuffer(item);
           const len = Math.min(bytes.length, field.length);
           chunk.set(bytes.subarray(0, len));
        }
    } catch (e) {
        console.error('Error generating array element:', e);
    }
    return chunk;
  }

  private generateField(field: FieldDefinition, value: any): Uint8Array {
    const buffer = new Uint8Array(field.length);
    const view = new DataView(buffer.buffer);
    const isLE = field.endianness === 'le';

    // Handle undefined/null
    if (value === undefined || value === null) {
      if (field.type === 'string') return buffer;
      if (['byte', 'array'].includes(field.type)) return buffer;
      value = 0;
    }

    try {
      switch (field.type) {
        case 'int8':
          view.setInt8(0, Number(value));
          break;
        case 'uint8':
          view.setUint8(0, Number(value));
          break;
        case 'int16':
          view.setInt16(0, Number(value), isLE);
          break;
        case 'uint16':
          view.setUint16(0, Number(value), isLE);
          break;
        case 'int32':
          view.setInt32(0, Number(value), isLE);
          break;
        case 'uint32':
          view.setUint32(0, Number(value), isLE);
          break;
        case 'int64':
          view.setBigInt64(0, BigInt(value), isLE);
          break;
        case 'uint64':
          view.setBigUint64(0, BigInt(value), isLE);
          break;
        case 'string':
          const encoder = new TextEncoder();
          const strBytes = encoder.encode(String(value));
          const copyLen = Math.min(strBytes.length, field.length);
          buffer.set(strBytes.subarray(0, copyLen));
          break;
        case 'array':
           let items: any[] = [];
           if (Array.isArray(value)) {
               items = value;
           } else if (typeof value === 'string') {
               const trimmed = value.trim();
               items = trimmed ? trimmed.split(';').map(s => s.trim()).filter(s => s !== '') : [];
           } else {
               items = [value];
           }

           const totalLen = items.length * field.length;
           const newBuffer = new Uint8Array(totalLen);
           
           items.forEach((item, idx) => {
               const chunk = this.generateElement(field, item);
               newBuffer.set(chunk, idx * field.length);
           });
           return newBuffer;
        case 'byte':
           // Treat as raw bytes (hex string)
           if (typeof value === 'string') {
             const bytes = hexToBuffer(value);
             const len = Math.min(bytes.length, field.length);
             buffer.set(bytes.subarray(0, len));
           } else if (typeof value === 'number') {
             view.setUint8(0, value);
           } else if (Array.isArray(value)) {
             const bytes = new Uint8Array(value);
             const len = Math.min(bytes.length, field.length);
             buffer.set(bytes.subarray(0, len));
           }
           break;
      }
    } catch (e) {
      console.error(`Error generating field ${field.name}:`, e);
    }

    return buffer;
  }
}
