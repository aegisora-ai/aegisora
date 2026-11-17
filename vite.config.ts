import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.aegisora.org",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "aegisora-csp",
      apply: "build",
      transformIndexHtml(html: string) {
        return html.replace("<!--CSP-->", `<meta http-equiv="Content-Security-Policy" content="${csp}">`);
      },
    },
  ],
  build: { outDir: "dist", emptyOutDir: true },
});