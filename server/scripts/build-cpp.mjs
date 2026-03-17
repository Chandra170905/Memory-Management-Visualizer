import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "..", "..");
const cppFile = path.join(projectRoot, "server", "cpp", "simulator.cpp");
const binDir = path.join(projectRoot, "server", "bin");
const outName = process.platform === "win32" ? "simulator.exe" : "simulator";
const outFile = path.join(binDir, outName);

fs.mkdirSync(binDir, { recursive: true });

const args = [
  "-std=c++17",
  "-O2",
  "-Wall",
  "-Wextra",
  cppFile,
  "-o",
  outFile
];

const cmd = "g++";
const res = spawnSync(cmd, args, { stdio: "inherit" });

if (res.error) {
  // eslint-disable-next-line no-console
  console.error(`Failed to run ${cmd}: ${res.error.message}`);
  process.exit(1);
}

process.exit(res.status ?? 0);

