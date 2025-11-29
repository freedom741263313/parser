import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProtocolRule, EnumDefinition, PacketTemplate, AutoReplyRule } from '../types/rule';
import { IPC_STORE, AppData } from '../types/store';

interface StoreContextType {
  rules: ProtocolRule[];
  enums: EnumDefinition[];
  templates: PacketTemplate[];
  replyRules: AutoReplyRule[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveRules: (rules: ProtocolRule[]) => Promise<void>;
  saveEnums: (enums: EnumDefinition[]) => Promise<void>;
  saveTemplates: (templates: PacketTemplate[]) => Promise<void>;
  saveReplyRules: (rules: AutoReplyRule[]) => Promise<void>;
  importData: () => Promise<void>;
  exportData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [rules, setRules] = useState<ProtocolRule[]>([]);
  const [enums, setEnums] = useState<EnumDefinition[]>([]);
  const [templates, setTemplates] = useState<PacketTemplate[]>([]);
  const [replyRules, setReplyRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getIpcRenderer = () => {
    if (window.require) {
      try {
        return window.require('electron').ipcRenderer;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const fetchAll = useCallback(async () => {
    const ipc = getIpcRenderer();
    if (!ipc) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data: AppData = await ipc.invoke(IPC_STORE.GET_ALL);
      setRules(data.rules || []);
      setEnums(data.enums || []);
      setTemplates(data.templates || []);
      setReplyRules(data.replyRules || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch store:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRules = useCallback(async (newRules: ProtocolRule[]) => {
    const ipc = getIpcRenderer();
    if (!ipc) {
      setRules(newRules);
      return;
    }

    try {
      await ipc.invoke(IPC_STORE.SAVE_RULES, newRules);
      setRules(newRules);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const saveEnums = useCallback(async (newEnums: EnumDefinition[]) => {
    const ipc = getIpcRenderer();
    if (!ipc) {
      setEnums(newEnums);
      return;
    }
    try {
      await ipc.invoke(IPC_STORE.SAVE_ENUMS, newEnums);
      setEnums(newEnums);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const saveTemplates = useCallback(async (newTemplates: PacketTemplate[]) => {
    const ipc = getIpcRenderer();
    if (!ipc) {
      setTemplates(newTemplates);
      return;
    }
    try {
      await ipc.invoke(IPC_STORE.SAVE_TEMPLATES, newTemplates);
      setTemplates(newTemplates);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const saveReplyRules = useCallback(async (newReplyRules: AutoReplyRule[]) => {
    const ipc = getIpcRenderer();
    if (!ipc) {
      setReplyRules(newReplyRules);
      return;
    }
    try {
      await ipc.invoke(IPC_STORE.SAVE_REPLY_RULES, newReplyRules);
      setReplyRules(newReplyRules);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const importData = async () => {
    const ipc = getIpcRenderer();
    if (!ipc) return;
    try {
      const res = await ipc.invoke(IPC_STORE.IMPORT_DATA);
      if (res.success && res.data) {
        setRules(res.data.rules || []);
        setEnums(res.data.enums || []);
        setTemplates(res.data.templates || []);
        setReplyRules(res.data.replyRules || []);
      } else if (res.error && res.error !== 'Cancelled') {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const exportData = async () => {
    const ipc = getIpcRenderer();
    if (!ipc) return;
    try {
      const res = await ipc.invoke(IPC_STORE.EXPORT_DATA);
      if (!res.success && res.error && res.error !== 'Cancelled') {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const value = {
    rules,
    enums,
    templates,
    replyRules,
    loading,
    error,
    refresh: fetchAll,
    saveRules,
    saveEnums,
    saveTemplates,
    saveReplyRules,
    importData,
    exportData
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
