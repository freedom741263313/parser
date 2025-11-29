export type ProtocolType = 'custom' | 'stun' | 'sip' | 'dns' | 'dhcp';

export type FieldType = 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'int64' | 'uint64' | 'string' | 'byte' | 'array';

export type Endianness = 'be' | 'le';

export type ParserAlgorithm = 'default' | 'longToIp' | 'bcd' | 'utf8' | 'hexStr' | 'c_string' | 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'int64' | 'uint64';

export interface EnumItem {
  value: number | string;
  label: string;
  description?: string;
}

export interface EnumDefinition {
  id: string;
  name: string;
  items: EnumItem[];
}

export interface FieldCondition {
  fieldRef: string; // Reference to another field name
  value: number | string;
  // If condition met, how to change parsing?
  // For now simple: if fieldRef == value, this field exists or changes definition
  // Or maybe: switch rule?
  // PRD says: "根据字段长度动态解析为不同名称和枚举" or "如果 字段A == X，则下一段解析为 结构体B"
}

export interface FieldDefinition {
  id: string;
  name: string;
  offset?: number; // If undefined, auto-calculated from previous
  length: number; // in bytes. For string, fixed length.
  type: FieldType;
  endianness: Endianness;
  algorithm: ParserAlgorithm;
  enumId?: string; // Reference to EnumDefinition.id
  countFieldId?: string; // For array type: reference to a previous field that defines the count
  description?: string;
}

export interface ProtocolRule {
  id: string;
  name: string;
  type: ProtocolType;
  description?: string;
  fields: FieldDefinition[]; // For custom protocols
  sampleHex?: string; // User saved sample
}

export interface PacketTemplate {
  id: string;
  name: string;
  protocolId: string;
  values: Record<string, any>; // fieldId -> value
}

export interface ReplyAction {
  templateId: string;
  delay: number; // milliseconds
}

export interface AutoReplyRule {
  id: string;
  isActive: boolean;
  name: string;
  matchProtocolId: string;
  matchFieldId: string;
  matchValue: string;
  actions: ReplyAction[];
}

export interface ParsedField {
  name: string;
  rawHex: string;
  value: any;
  displayValue: string; // Includes enum label if applicable
  formattedValue?: string; // Formatted value without enum label
  arrayValues?: string[]; // For array fields, stores formatted value of each element
  meaning?: string;
  description?: string;
  offset: number;
  length: number;
  children?: ParsedField[]; // For nested structures
  error?: string;
}
