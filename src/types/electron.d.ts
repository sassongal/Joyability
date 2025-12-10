export {};

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<unknown>;
      on: (channel: string, listener: (...args: unknown[]) => void) => () => void;
    };
  }
}
