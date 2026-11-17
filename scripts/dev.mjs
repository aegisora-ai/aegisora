import { createServer } from "vite";
import { spawn } from "node:child_process";
import electron from "electron";

const server = await createServer({ server: { port: 5173, strictPort: true } });
await server.listen();

const env = { ...process.env, AEGISORA_DEV_URL: "http://localhost:5173" };
delete env.ELECTRON_RUN_AS_NODE; // VS Code terminals set this and break Electron

const child = spawn(electron, ["."], { stdio: "inherit", env });
const stop = async () => { await server.close(); process.exit(0); };
child.on("exit", stop);
process.on("SIGINT", stop);