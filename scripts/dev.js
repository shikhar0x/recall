#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function logPrefix(name, color, data) {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}[${name}]${colors.reset} ${line}`);
    }
  }
}

const fs = require("fs");

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// Preload .env from root and backend directories
loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, "backend", ".env"));

console.log(`${colors.green}=== Launching Recall Workspace (Frontend + Backend) ===${colors.reset}\n`);

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "frontend"),
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

frontend.stdout.on("data", (data) => logPrefix("frontend", colors.cyan, data));
frontend.stderr.on("data", (data) => logPrefix("frontend", colors.red, data));

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "backend"),
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

backend.stdout.on("data", (data) => logPrefix("backend", colors.magenta, data));
backend.stderr.on("data", (data) => logPrefix("backend", colors.yellow, data));

function cleanup() {
  console.log(`\n${colors.yellow}Shutting down processes...${colors.reset}`);
  frontend.kill("SIGTERM");
  backend.kill("SIGTERM");
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

frontend.on("close", (code) => {
  console.log(`${colors.cyan}[frontend] exited with code ${code}${colors.reset}`);
});

backend.on("close", (code) => {
  console.log(`${colors.magenta}[backend] exited with code ${code}${colors.reset}`);
});
