const KEY = "mmv:scenarios:v1";
const MAX_ITEMS = 25;

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function readAll() {
  const raw = localStorage.getItem(KEY);
  const items = safeJsonParse(raw || "[]", []);
  return Array.isArray(items) ? items : [];
}

function writeAll(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listScenarios(kind) {
  const all = readAll();
  const filtered = kind ? all.filter((x) => x?.kind === kind) : all;
  filtered.sort((a, b) => String(b?.createdAt || "").localeCompare(a?.createdAt || ""));
  return filtered;
}

export function addScenario(input) {
  const scenario = {
    id: newId(),
    name: String(input?.name || "Untitled"),
    kind: input?.kind === "compare" ? "compare" : "sim",
    frames: Number(input?.frames) || 3,
    algo: input?.algo ? String(input.algo) : undefined,
    refInput: String(input?.refInput || ""),
    createdAt: nowIso()
  };

  const all = readAll();
  const next = [scenario, ...all].slice(0, MAX_ITEMS);
  writeAll(next);
  return scenario;
}

export function removeScenario(id) {
  const all = readAll();
  const next = all.filter((x) => x?.id !== id);
  writeAll(next);
  return next.length !== all.length;
}

