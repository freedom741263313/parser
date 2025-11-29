import { ProtocolRule, EnumDefinition, PacketTemplate, AutoReplyRule } from './rule';

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
