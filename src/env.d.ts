/// <reference types="vite/client" />
interface Window {
  mosell?: { platform: string; openExternal: (url: string) => Promise<void> };
}