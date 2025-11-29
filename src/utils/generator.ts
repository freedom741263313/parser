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
        case 'byte':
        case 'array':
           if (Array.isArray(value)) {
             // Calculate total length based on array size and element length
             const totalLen = value.length * field.length;
             const newBuffer = new Uint8Array(totalLen);
             
             value.forEach((item, idx) => {
               const chunk = new Uint8Array(field.length);
               const chunkView = new DataView(chunk.buffer);
               
               try {
                 if (field.algorithm === 'longToIp' && typeof item === 'string') {
                    const parts = item.split('.').map(Number);
                    if (parts.length === 4) {
                        const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
                        chunkView.setUint32(0, ipNum, isLE); // IP is usually BE, but respect field config
                    }
                 } else if (field.algorithm === 'c_string' || field.algorithm === 'utf8') {
                    const encoder = new TextEncoder();
                    const strBytes = encoder.encode(String(item));
                    const copyLen = Math.min(strBytes.length, field.length);
                    chunk.set(strBytes.subarray(0, copyLen));
                    // c_string implies null termination, but buffer is zero-init, so if len < field.length it is null-terminated.
                    // If len == field.length, it might not be null-terminated (which is common in some fixed-len protocols).
                 } else if (['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64'].includes(field.algorithm)) {
                     const num = Number(item);
                     switch (field.algorithm) {
                         case 'int8': chunkView.setInt8(0, num); break;
                         case 'uint8': chunkView.setUint8(0, num); break;
                         case 'int16': chunkView.setInt16(0, num, isLE); break;
                         case 'uint16': chunkView.setUint16(0, num, isLE); break;
                         case 'int32': chunkView.setInt32(0, num, isLE); break;
                         case 'uint32': chunkView.setUint32(0, num, isLE); break;
                         case 'int64': chunkView.setBigInt64(0, BigInt(item), isLE); break;
                         case 'uint64': chunkView.setBigUint64(0, BigInt(item), isLE); break;
                     }
                 } else if (typeof item === 'number') {
                    // Heuristic for numbers (fallback if algorithm is default/hexStr but input is number)
                    if (field.length === 1) chunkView.setUint8(0, item);
                    else if (field.length === 2) chunkView.setUint16(0, item, isLE);
                    else if (field.length === 4) chunkView.setUint32(0, item, isLE);
                    else if (field.length === 8) chunkView.setBigUint64(0, BigInt(item), isLE);
                 } else if (typeof item === 'string') {
                    const bytes = hexToBuffer(item);
                    const len = Math.min(bytes.length, field.length);
                    chunk.set(bytes.subarray(0, len));
                 }
               } catch (e) {
                 console.error('Error generating array element:', e);
               }
               
               newBuffer.set(chunk, idx * field.length);
             });
             return newBuffer;
           }
           // Assume input is hex string (legacy/single value)
           if (typeof value === 'string') {
             const bytes = hexToBuffer(value);
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
