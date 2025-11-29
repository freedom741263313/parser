import { ProtocolRule, FieldDefinition, ParsedField, EnumDefinition } from '../types/rule';
import { hexToBuffer, bufferToHex } from './hex';

export class ParserEngine {
  private enums: Map<string, EnumDefinition>;

  constructor(enums: EnumDefinition[] = []) {
    this.enums = new Map(enums.map(e => [e.id, e]));
  }

  parse(data: Uint8Array, rule: ProtocolRule): ParsedField[] {
    if (rule.type !== 'custom') {
      throw new Error(`Use specialized parser for ${rule.type}`);
    }

    const results: ParsedField[] = [];
    const resultsMap = new Map<string, ParsedField>();
    let currentOffset = 0;

    for (const field of rule.fields) {
      if (currentOffset >= data.length) {
        break; // Stop if no more data
      }

      const offset = field.offset !== undefined ? field.offset : currentOffset;
      
      // Determine length
      let length = field.length;
      let count = 1;

      if (field.type === 'array' && field.countFieldId) {
        const countField = resultsMap.get(field.countFieldId);
        if (countField) {
          count = Number(countField.value);
          if (isNaN(count)) count = 0;
        }
        // For array with count field, length is total length
        // field.length is per-element length
        length = field.length * count;
      }

      // Check bounds
      if (offset + length > data.length) {
        results.push({
          name: field.name,
          rawHex: '',
          value: null,
          displayValue: 'Error: Insufficient data',
          offset,
          length,
          error: 'Insufficient data'
        });
        break;
      }

      const slice = data.slice(offset, offset + length);
      const rawHex = bufferToHex(slice);
      
      let value: any;
      let displayValue: string;
      let formattedValue: string;
      let arrayValues: string[] | undefined;

      let meaning: string = field.name;
      
      if (field.type === 'array' && field.countFieldId) {
          const values: any[] = [];
          const displayValues: string[] = [];
          const elementLength = field.length;

          for (let i = 0; i < count; i++) {
              const elemSlice = slice.slice(i * elementLength, (i + 1) * elementLength);
              
              // Parse element based on algorithm
              let elemValue: any;
              let elemDisplay: string;

              // Special handling for algorithms requiring numbers
              if (field.algorithm === 'longToIp' && elementLength === 4) {
                  const view = new DataView(elemSlice.buffer, elemSlice.byteOffset, elemSlice.byteLength);
                  elemValue = view.getUint32(0, field.endianness === 'le');
                  elemDisplay = this.longToIp(elemValue);
              } else if (field.algorithm === 'utf8') {
                  elemValue = new TextDecoder().decode(elemSlice);
                  elemDisplay = elemValue;
              } else if (field.algorithm === 'c_string') {
                  const nullIndex = elemSlice.indexOf(0);
                  const strSlice = nullIndex !== -1 ? elemSlice.subarray(0, nullIndex) : elemSlice;
                  elemValue = new TextDecoder().decode(strSlice);
                  elemDisplay = elemValue;
              } else if (field.algorithm === 'hexStr') {
                  elemValue = bufferToHex(elemSlice);
                  elemDisplay = elemValue;
              } else {
                  // Try numeric algorithms
                  const view = new DataView(elemSlice.buffer, elemSlice.byteOffset, elemSlice.byteLength);
                  const isLE = field.endianness === 'le';
                  try {
                      switch (field.algorithm) {
                          case 'int8': elemValue = view.getInt8(0); break;
                          case 'uint8': elemValue = view.getUint8(0); break;
                          case 'int16': elemValue = view.getInt16(0, isLE); break;
                          case 'uint16': elemValue = view.getUint16(0, isLE); break;
                          case 'int32': elemValue = view.getInt32(0, isLE); break;
                          case 'uint32': elemValue = view.getUint32(0, isLE); break;
                          case 'int64': elemValue = view.getBigInt64(0, isLE); break;
                          case 'uint64': elemValue = view.getBigUint64(0, isLE); break;
                          default:
                              // Default fallback: treat as hex string
                              elemValue = bufferToHex(elemSlice);
                              break;
                      }
                  } catch (e) {
                      // Fallback if slice length doesn't match type
                      elemValue = bufferToHex(elemSlice);
                  }
                  elemDisplay = String(elemValue);
              }
              
              values.push(elemValue);
              displayValues.push(elemDisplay);
          }
          value = values;
          displayValue = `[${displayValues.join(', ')}]`;
          formattedValue = displayValue;
          arrayValues = displayValues;
      } else {
          const res = this.parseFieldValue(slice, field);
          value = res.value;
          displayValue = res.displayValue;
          formattedValue = res.formattedValue;
          meaning = res.meaning;
      }

      const result: ParsedField = {
        name: field.name,
        rawHex,
        value,
        displayValue,
        formattedValue,
        arrayValues,
        meaning,
        offset,
        length
      };

      results.push(result);
      resultsMap.set(field.id, result);

      currentOffset = offset + length;
    }

    return results;
  }

  private parseFieldValue(data: Uint8Array, field: FieldDefinition): { value: any, displayValue: string, formattedValue: string, meaning: string } {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const isLE = field.endianness === 'le';
    let value: any;
    let meaning: string = field.name;

    try {
      switch (field.type) {
        case 'int8': value = view.getInt8(0); break;
        case 'uint8': value = view.getUint8(0); break;
        case 'int16': value = view.getInt16(0, isLE); break;
        case 'uint16': value = view.getUint16(0, isLE); break;
        case 'int32': value = view.getInt32(0, isLE); break;
        case 'uint32': value = view.getUint32(0, isLE); break;
        // JS Bitwise operations are 32-bit, be careful with 64-bit
        case 'int64': value = view.getBigInt64(0, isLE); break;
        case 'uint64': value = view.getBigUint64(0, isLE); break;
        case 'string': value = new TextDecoder().decode(data); break;
        case 'byte': value = data[0]; break;
        case 'array': value = Array.from(data); break;
        default: value = Array.from(data);
      }
    } catch (e) {
      return { value: null, displayValue: 'Parse Error', formattedValue: 'Parse Error', meaning: 'Parse Error' };
    }

    let displayValue = String(value);

    // Apply Algorithms
    if (field.algorithm === 'longToIp' && (field.type === 'uint32' || field.type === 'int32')) {
      displayValue = this.longToIp(Number(value));
    } else if (field.algorithm === 'hexStr') {
      displayValue = bufferToHex(data);
    }

    const formattedValue = displayValue;

    // Apply Enums
    if (field.enumId && this.enums.has(field.enumId)) {
      const enumDef = this.enums.get(field.enumId);
      const enumItem = enumDef?.items.find(item => {
        // Support both number and hex string comparisons
        const itemVal = item.value;
        const currentVal = Number(value);
        
        if (typeof itemVal === 'number') {
          return itemVal === currentVal;
        } else if (typeof itemVal === 'string') {
          if (itemVal.startsWith('0x') || itemVal.startsWith('0X')) {
             return parseInt(itemVal, 16) === currentVal;
          }
          return Number(itemVal) === currentVal;
        }
        return false;
      });

      if (enumItem) {
        meaning = enumItem.label;
        displayValue = `${displayValue} (${enumItem.label})`;
      }
    }

    return { value, displayValue, formattedValue, meaning };
  }

  private longToIp(long: number): string {
    return [
      (long >>> 24) & 0xFF,
      (long >>> 16) & 0xFF,
      (long >>> 8) & 0xFF,
      long & 0xFF
    ].join('.');
  }
}
