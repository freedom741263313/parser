import { ProtocolRule, FieldDefinition } from '../types/rule';
import { cleanHex } from './hex';

export class PacketBuilder {
  static build(rule: ProtocolRule, values: Record<string, any>): string {
    const chunks: Uint8Array[] = [];

    for (const field of rule.fields) {
      const value = values[field.id];
      let buffer: Uint8Array;

      try {
        buffer = PacketBuilder.buildField(field, value);
      } catch (e) {
        console.error(`Error building field ${field.name}:`, e);
        // Fill with zeros if error
        buffer = new Uint8Array(field.length);
      }
      
      // Handle padding or truncation if needed (though buildField should handle it)
      if (buffer.length !== field.length && field.type !== 'array') { // Arrays might be variable if we supported it, but here length is fixed per definition usually
         // Actually for 'string', length is fixed in definition.
         if (buffer.length < field.length) {
             const padded = new Uint8Array(field.length);
             padded.set(buffer);
             buffer = padded;
         } else if (buffer.length > field.length) {
             buffer = buffer.slice(0, field.length);
         }
      }
      
      chunks.push(buffer);
    }

    // Concatenate all chunks
    const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to hex string
    return Array.from(result)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }

  private static buildField(field: FieldDefinition, value: any): Uint8Array {
    let buffer = new Uint8Array(field.length);
    const view = new DataView(buffer.buffer);
    const isLE = field.endianness === 'le';

    // Default value handling
    if (value === undefined || value === null || value === '') {
        return buffer; // Return zeros
    }

    // Handle special algorithms first (BUT NOT for array type, let array logic handle splitting first)
    if (field.type !== 'array') {
        if (field.algorithm === 'longToIp') {
            const parts = String(value).split('.');
            if (parts.length === 4) {
                const num = (parseInt(parts[0]) << 24) | (parseInt(parts[1]) << 16) | (parseInt(parts[2]) << 8) | parseInt(parts[3]);
                view.setUint32(0, num >>> 0, isLE); // Unsigned shift to ensure positive
                return buffer;
            }
        }

        if (field.algorithm === 'hexStr') {
            const hex = cleanHex(String(value));
            const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
            return bytes;
        }

        if (field.algorithm === 'bcd') {
            // Remove non-digits
            let s = String(value).replace(/[^0-9]/g, '');
            const targetLen = field.length * 2;
            // Pad with leading zeros to match target length (2 digits per byte)
            if (s.length < targetLen) {
                s = s.padStart(targetLen, '0');
            } else if (s.length > targetLen) {
                s = s.slice(0, targetLen); // Truncate if too long
            }
            
            const bytes = new Uint8Array(field.length);
            for (let i = 0; i < field.length; i++) {
                const byteStr = s.substring(i * 2, i * 2 + 2);
                bytes[i] = parseInt(byteStr, 16);
            }
            return bytes;
        }
    }

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
        buffer.set(strBytes.slice(0, field.length)); // Will truncate if too long
        break;
      case 'byte':
        buffer[0] = Number(value);
        break;
      case 'array':
        // User can input semicolon separated values for array elements
        // E.g. "1;2;3" or "A;B;C"
        if (typeof value === 'string') {
             // 1. Try semicolon separation
             const parts = value.split(';').map(p => p.trim()).filter(p => p !== '');
             
             if (parts.length > 0) {
                 // Build each element
                 const elementBuffers: Uint8Array[] = [];
                 
                 // Create a temporary field definition for the element
                 // Array field length is per-element length
                 
                 // Determine element type from algorithm
                  let elemType: any = 'uint8';
                  // Explicitly check each literal to avoid type overlap issues
                  const alg = field.algorithm as string; // Cast to string to avoid TS overlap errors if types are disjoint unions
                  if (alg === 'int8') elemType = 'int8';
                  else if (alg === 'uint8') elemType = 'uint8';
                  else if (alg === 'int16') elemType = 'int16';
                  else if (alg === 'uint16') elemType = 'uint16';
                  else if (alg === 'int32') elemType = 'int32';
                  else if (alg === 'uint32') elemType = 'uint32';
                  else if (alg === 'int64') elemType = 'int64';
                  else if (alg === 'uint64') elemType = 'uint64';
                  else if (alg === 'hexStr') elemType = 'byte'; // Fallback for hexStr in array
                  else if (alg === 'utf8') elemType = 'string';
                  else if (alg === 'bcd') elemType = 'string';
                  else if (alg === 'c_string') elemType = 'string';
                  else if (alg === 'longToIp') elemType = 'string';
                 
                 const tempField: FieldDefinition = {
                     ...field,
                     type: elemType,
                     length: field.length // per element length
                 };

                 for (const part of parts) {
                     try {
                         // If part is numeric string but type requires number, convert
                         // buildField handles conversion mostly
                         const elemBuf = PacketBuilder.buildField(tempField, part);
                         elementBuffers.push(elemBuf);
                     } catch (e) {
                         console.error(`Error building array element ${part}:`, e);
                         elementBuffers.push(new Uint8Array(field.length));
                     }
                 }
                 
                 // Concatenate all elements
                 const totalLen = elementBuffers.reduce((acc, b) => acc + b.length, 0);
                 const res = new Uint8Array(totalLen);
                 let off = 0;
                 for (const buf of elementBuffers) {
                     res.set(buf, off);
                     off += buf.length;
                 }
                 buffer = res; // Replace the default buffer
             } else {
                 // Fallback to comma or hex if no semicolons
                 if (value.includes(',')) {
                     const nums = value.split(',').map(v => parseInt(v.trim()));
                     buffer.set(new Uint8Array(nums).slice(0, field.length));
                 } else {
                     const hex = cleanHex(value);
                     const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
                     // If it's just one large hex string, maybe it covers multiple elements?
                     // For now assume it fits into the allocated buffer or is raw bytes
                     // If we want to support raw hex for array, we should let it expand
                     buffer = bytes; 
                 }
             }
        } else if (Array.isArray(value)) {
             buffer.set(new Uint8Array(value).slice(0, field.length));
        }
        break;
      default:
        break;
    }

    return buffer;
  }
}
