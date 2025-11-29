import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { UdpService } from './services/udpService';
import { StoreService } from './services/storeService';
import { IPC_CHANNELS, UdpStartPayload, UdpSendPayload } from './common/udp';
import { IPC_STORE, AppData } from './common/store';

const udpService = new UdpService();
const storeService = new StoreService();

// Setup UDP Service Listeners
udpService.on('message', (msg) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.UDP_MESSAGE, msg);
    }
  });
});

udpService.on('error', (err) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.UDP_ERROR, err.message || String(err));
    }
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (!app.isPackaged) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools(); // Optional: Open DevTools in development
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// IPC Handlers
ipcMain.handle(IPC_CHANNELS.UDP_START, async (_, payload: UdpStartPayload) => {
  try {
    await udpService.start(payload.port);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.UDP_STOP, async () => {
  try {
    await udpService.stop();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.UDP_SEND, async (_, payload: UdpSendPayload) => {
  try {
    await udpService.send(payload.ip, payload.port, payload.data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
});

// Store Handlers
ipcMain.handle(IPC_STORE.GET_ALL, () => {
  return storeService.getAll();
});

ipcMain.handle(IPC_STORE.SAVE_RULES, async (_, rules: any[]) => {
  await storeService.saveRules(rules);
  return { success: true };
});

ipcMain.handle(IPC_STORE.SAVE_ENUMS, async (_, enums: any[]) => {
  await storeService.saveEnums(enums);
  return { success: true };
});

ipcMain.handle(IPC_STORE.SAVE_TEMPLATES, async (_, templates: any[]) => {
  await storeService.saveTemplates(templates);
  return { success: true };
});

ipcMain.handle(IPC_STORE.SAVE_REPLY_RULES, async (_, rules: any[]) => {
  await storeService.saveReplyRules(rules);
  return { success: true };
});

ipcMain.handle(IPC_STORE.EXPORT_DATA, async () => {
    try {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Export Rules and Enums',
            defaultPath: 'parser_data.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (filePath) {
            const data = storeService.getAll();
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return { success: true };
        }
        return { success: false, error: 'Cancelled' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

ipcMain.handle(IPC_STORE.IMPORT_DATA, async () => {
    try {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Import Rules and Enums',
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (filePaths && filePaths.length > 0) {
            const content = await fs.readFile(filePaths[0], 'utf-8');
            const parsed = JSON.parse(content);
            
            // Validate minimal structure
            if (!Array.isArray(parsed.rules) && !Array.isArray(parsed.enums)) {
                return { success: false, error: 'Invalid format: missing rules or enums array' };
            }

            // Merge logic: Merge by ID, overwrite existing
            const current = storeService.getAll();
            const newRules = parsed.rules || [];
            const newEnums = parsed.enums || [];
            const newTemplates = parsed.templates || [];
            const newReplyRules = parsed.replyRules || [];

            // Create maps for easy merging
            const rulesMap = new Map(current.rules.map(r => [r.id, r]));
            newRules.forEach((r: any) => rulesMap.set(r.id, r));

            const enumsMap = new Map(current.enums.map(e => [e.id, e]));
            newEnums.forEach((e: any) => enumsMap.set(e.id, e));

            const templatesMap = new Map((current.templates || []).map(t => [t.id, t]));
            newTemplates.forEach((t: any) => templatesMap.set(t.id, t));

            const replyRulesMap = new Map((current.replyRules || []).map(r => [r.id, r]));
            newReplyRules.forEach((r: any) => replyRulesMap.set(r.id, r));

            const newData: AppData = {
                rules: Array.from(rulesMap.values()),
                enums: Array.from(enumsMap.values()),
                templates: Array.from(templatesMap.values()),
                replyRules: Array.from(replyRulesMap.values())
            };

            await storeService.saveAll(newData);
            return { success: true, data: newData };
        }
        return { success: false, error: 'Cancelled' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  await storeService.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
