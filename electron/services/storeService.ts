import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { AppData } from '../common/store';

export class StoreService {
  private dataPath: string;
  private data: AppData;

  constructor() {
    // Ensure userData path is available (it should be in main process)
    this.dataPath = path.join(app.getPath('userData'), 'parser_data.json');
    this.data = { rules: [], enums: [] };
  }

  async init() {
    try {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(content);
      // Merge with defaults if needed, or just set
      this.data = {
        rules: Array.isArray(parsed.rules) ? parsed.rules : [],
        enums: Array.isArray(parsed.enums) ? parsed.enums : [],
        templates: Array.isArray(parsed.templates) ? parsed.templates : [],
        replyRules: Array.isArray(parsed.replyRules) ? parsed.replyRules : []
      };
    } catch (error) {
      // File doesn't exist or invalid, keep defaults
      console.log('Initializing new data store at', this.dataPath);
      await this.save();
    }
  }

  getAll(): AppData {
    return this.data;
  }

  async saveRules(rules: any[]) {
    this.data.rules = rules;
    await this.save();
  }

  async saveEnums(enums: any[]) {
    this.data.enums = enums;
    await this.save();
  }

  async saveTemplates(templates: any[]) {
    this.data.templates = templates;
    await this.save();
  }

  async saveReplyRules(rules: any[]) {
    this.data.replyRules = rules;
    await this.save();
  }
  
  async saveAll(data: AppData) {
      this.data = data;
      await this.save();
  }

  private async save() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
  }
}
