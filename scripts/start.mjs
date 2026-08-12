import { spawn } from "node:child_process";
import { config } from "../configs/index.ts";

const [mode, ...extraArgs] = process.argv.slice(2);
const command = mode === "start" ? "start" : "dev";

const child = spawn(
  "next",
  [command, "-H", config.host, "-p", config.port, ...extraArgs],
  { stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
