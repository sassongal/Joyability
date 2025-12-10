import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    const validChannels = ['fromMain'];
    if (!validChannels.includes(channel)) return () => undefined;

    const subscription = (_event: unknown, ...args: unknown[]) => listener(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  }
});
