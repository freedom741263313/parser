import { useState, useEffect, useCallback } from 'react';
import { ProtocolRule, EnumDefinition, PacketTemplate, AutoReplyRule } from '../types/rule';
import { IPC_STORE, AppData } from '../types/store';

export const useStore = () => {
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
        // Mock data for browser dev if needed, or just empty
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
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
    importData: async () => {
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
    },
    exportData: async () => {
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
    }
  };
};
