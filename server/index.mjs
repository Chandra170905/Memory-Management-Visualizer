import express from "express";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5174;

const BIN_NAME = process.platform === "win32" ? "simulator.exe" : "simulator";
const BIN_PATH = path.join(__dirname, "bin", BIN_NAME);

function isInt(n) {
  return Number.isInteger(n);
}

function runBinary(args, inputObj) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(BIN_PATH)) {
      reject(
        new Error(
          `C++ binary not found at ${BIN_PATH}. Build it first: npm run build:cpp`
        )
      );
      return;
    }

    const child = spawn(BIN_PATH, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));

    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(err || `C++ process failed with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`Invalid JSON from C++ binary.\n${String(e)}\n${out}`));
      }
    });

    child.stdin.write(JSON.stringify(inputObj));
    child.stdin.end();
  });
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    binaryExists: fs.existsSync(BIN_PATH),
    binaryPath: BIN_PATH
  });
});

app.post("/api/simulate", async (req, res) => {
  try {
    const frames = Number(req.body?.frames);
    const algorithm = String(req.body?.algorithm || "").toLowerCase();
    const reference = Array.isArray(req.body?.reference) ? req.body.reference : [];

    if (!isInt(frames) || frames < 1 || frames > 12) {
      res.status(400).send("Invalid frames (expected integer 1..12).");
      return;
    }
    if (!["fifo", "lru", "optimal"].includes(algorithm)) {
      res.status(400).send("Invalid algorithm (fifo|lru|optimal).");
      return;
    }
    if (
      !reference.length ||
      !reference.every((x) => typeof x === "number" && Number.isFinite(x))
    ) {
      res.status(400).send("Invalid reference (expected array of numbers).");
      return;
    }

    const payload = { frames, algorithm, reference };
    const data = await runBinary(["simulate"], payload);
    res.json(data);
  } catch (e) {
    res.status(500).send(String(e?.message || e));
  }
});

app.post("/api/compare", async (req, res) => {
  try {
    const frames = Number(req.body?.frames);
    const reference = Array.isArray(req.body?.reference) ? req.body.reference : [];

    if (!isInt(frames) || frames < 1 || frames > 12) {
      res.status(400).send("Invalid frames (expected integer 1..12).");
      return;
    }
    if (
      !reference.length ||
      !reference.every((x) => typeof x === "number" && Number.isFinite(x))
    ) {
      res.status(400).send("Invalid reference (expected array of numbers).");
      return;
    }

    const payload = { frames, reference };
    const data = await runBinary(["compare"], payload);
    res.json(data);
  } catch (e) {
    res.status(500).send(String(e?.message || e));
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MMV API running on http://localhost:${PORT}`);
});

