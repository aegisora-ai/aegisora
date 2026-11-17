/// <reference types="vite/client" />
interface Window {
  aegisora?: { platform: string; openExternal: (url: string) => Promise<void> };
}