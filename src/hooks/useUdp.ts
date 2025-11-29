import { useState, useEffect, useCallback } from 'react';
import { IPC_CHANNELS, UdpMessage } from '../types/udp';

export const useUdp = () => {
  const [messages, setMessages] = useState<UdpMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIpcRenderer = () => {
    if (window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        return ipcRenderer;
      } catch (e) {
        console.warn('Electron ipcRenderer not found');
        return null;
      }
    }
    return null;
  };

  const start = useCallback(async (port: number) => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      setError('Electron environment not found');
      return;
    }
    
    try {
      const res = await ipcRenderer.invoke(IPC_CHANNELS.UDP_START, { port });
      if (res.success) {
        setIsListening(true);
        setError(null);
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }, []);

  const stop = useCallback(async () => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) return;

    try {
      const res = await ipcRenderer.invoke(IPC_CHANNELS.UDP_STOP);
      if (res.success) {
        setIsListening(false);
        setError(null);
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }, []);

  const send = useCallback(async (ip: string, port: number, data: string) => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) {
      setError('Electron environment not found');
      return;
    }

    try {
      const res = await ipcRenderer.invoke(IPC_CHANNELS.UDP_SEND, { ip, port, data });
      if (!res.success) {
        setError(res.error);
      } else {
        // Manually add sent message to list for feedback
        const sentMsg: UdpMessage = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          direction: 'out',
          remoteAddress: ip,
          remotePort: port,
          data: data
        };
        setMessages(prev => [sentMsg, ...prev]);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) return;

    const handleMessage = (_: any, msg: UdpMessage) => {
      setMessages(prev => [msg, ...prev]);
    };

    const handleError = (_: any, err: string) => {
      setError(err);
    };

    ipcRenderer.on(IPC_CHANNELS.UDP_MESSAGE, handleMessage);
    ipcRenderer.on(IPC_CHANNELS.UDP_ERROR, handleError);

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UDP_MESSAGE, handleMessage);
      ipcRenderer.removeListener(IPC_CHANNELS.UDP_ERROR, handleError);
    };
  }, []);

  return {
    messages,
    isListening,
    error,
    start,
    stop,
    send,
    clearMessages
  };
};
