// Duplicated from src/types/rule.ts to avoid rootDir issues in Electron build
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

export interface FieldDefinition {
  id: string;
  name: string;
  offset?: number;
  length: number;
  type: FieldType;
  endianness: Endianness;
  algorithm: ParserAlgorithm;
  enumId?: string;
  description?: string;
}

export interface ProtocolRule {
  id: string;
  name: string;
  type: ProtocolType;
  description?: string;
  fields: FieldDefinition[];
  sampleHex?: string;
}

export interface PacketTemplate {
  id: string;
  name: string;
  protocolId: string;
  values: Record<string, any>;
}

export interface AutoReplyRule {
  id: string;
  isActive: boolean;
  name: string;
  matchProtocolId: string;
  matchFieldId: string;
  matchValue: string;
  responseTemplateId: string;
}

export interface AppData {
  rules: ProtocolRule[];
  enums: EnumDefinition[];
  templates?: PacketTemplate[];
  replyRules?: AutoReplyRule[];
}

export const IPC_STORE = {
  GET_ALL: 'store:get-all',
  SAVE_RULES: 'store:save-rules',
  SAVE_ENUMS: 'store:save-enums',
  SAVE_TEMPLATES: 'store:save-templates',
  SAVE_REPLY_RULES: 'store:save-reply-rules',
  SAVE_ALL: 'store:save-all',
  IMPORT_DATA: 'store:import-data',
  EXPORT_DATA: 'store:export-data'
};
