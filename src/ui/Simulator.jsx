import { useEffect, useMemo, useRef, useState } from "react";
import { parseReferenceStringDetailed } from "../lib/parse.js";
import { simulate } from "../lib/api.js";
import { downloadJson } from "../lib/download.js";
import { PRESET_SCENARIOS, generateRandomReference, referenceToString } from "../lib/scenarios.js";
import { addScenario, listScenarios, removeScenario } from "../lib/storage.js";
import { buildShareUrl, readShareParams } from "../lib/share.js";
import MemoryFrames from "./components/MemoryFrames.jsx";
import StatPill from "./components/StatPill.jsx";

const ALGORITHMS = [
  { id: "fifo", label: "FIFO" },
  { id: "lru", label: "LRU" },
  { id: "optimal", label: "Optimal" }
];

function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export default function Simulator() {
  const [frames, setFrames] = useState(3);
  const [algo, setAlgo] = useState("fifo");
  const [refInput, setRefInput] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2");
  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speedMs, setSpeedMs] = useState(650);
  const timerRef = useRef(null);

  const parsed = useMemo(() => parseReferenceStringDetailed(refInput), [refInput]);
  const refPages = parsed.pages;
  const steps = result?.steps ?? [];

  const [savedId, setSavedId] = useState("");
  const [savedList, setSavedList] = useState(() => listScenarios("sim"));

  useEffect(() => {
    const p = readShareParams();
    if (p.tab !== "sim") return;
    setFrames(p.frames);
    if (p.algo && ["fifo", "lru", "optimal"].includes(p.algo)) setAlgo(p.algo);
    if (p.refInput) setRefInput(p.refInput);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(id);
  }, [notice]);

  const stats = useMemo(() => {
    if (!steps.length) return { faults: 0, hits: 0, total: 0 };
    let faults = 0;
    let hits = 0;
    for (const s of steps) {
      if (s.fault) faults += 1;
      else hits += 1;
    }
    return { faults, hits, total: steps.length };
  }, [steps]);

  const current = steps[stepIndex] ?? null;
  const previous = stepIndex > 0 ? steps[stepIndex - 1] : null;

  useEffect(() => {
    if (!autoPlay) return;
    if (!steps.length) return;
    if (stepIndex >= steps.length - 1) return;

    timerRef.current = setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, speedMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [autoPlay, stepIndex, steps.length, speedMs]);

  useEffect(() => {
    if (!steps.length) setAutoPlay(false);
  }, [steps.length]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!steps.length) return;
      const tag = String(e?.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAutoPlay(false);
        setStepIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setAutoPlay(false);
        setStepIndex((i) => Math.min(i + 1, Math.max(0, steps.length - 1)));
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (stepIndex >= steps.length - 1) return;
        setAutoPlay((p) => !p);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps.length, stepIndex]);

  function refreshSaved() {
    setSavedList(listScenarios("sim"));
  }

  function onLoadPreset(id) {
    const p = PRESET_SCENARIOS.find((x) => x.id === id);
    if (!p) return;
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    setFrames(p.frames);
    setRefInput(referenceToString(p.reference));
    setNotice(`Loaded preset: ${p.label}`);
  }

  function onRandom() {
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    const ref = generateRandomReference({ length: 24, maxPage: 9, locality: 0.55 });
    setRefInput(referenceToString(ref));
    setNotice("Generated a random reference string.");
  }

  async function onShare() {
    const url = buildShareUrl({ tab: "sim", frames, algo, refInput });
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Share link copied.");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  function onExport() {
    if (!result) return;
    downloadJson("mmv-simulation.json", {
      exportedAt: new Date().toISOString(),
      frames: clampInt(frames, { min: 1, max: 12, fallback: 3 }),
      algorithm: algo,
      reference: refPages,
      result
    });
    setNotice("Exported JSON.");
  }

  function onSave() {
    const name = window.prompt("Save this setup as:", "My simulation");
    if (!name) return;
    addScenario({ kind: "sim", name, frames, algo, refInput });
    refreshSaved();
    setNotice("Saved.");
  }

  function onLoadSaved(id) {
    const s = savedList.find((x) => x.id === id);
    if (!s) return;
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    setFrames(clampInt(s.frames, { min: 1, max: 12, fallback: 3 }));
    if (s.algo && ["fifo", "lru", "optimal"].includes(s.algo)) setAlgo(s.algo);
    setRefInput(String(s.refInput || ""));
    setSavedId(id);
    setNotice(`Loaded: ${s.name}`);
  }

  function onDeleteSaved() {
    if (!savedId) return;
    const s = savedList.find((x) => x.id === savedId);
    const ok = window.confirm(`Delete saved setup "${s?.name || "Untitled"}"?`);
    if (!ok) return;
    removeScenario(savedId);
    setSavedId("");
    refreshSaved();
    setNotice("Deleted.");
  }

  function findPrevFault(from) {
    for (let i = Math.min(from - 1, steps.length - 1); i >= 0; i -= 1) {
      if (steps[i]?.fault) return i;
    }
    return -1;
  }

  function findNextFault(from) {
    for (let i = Math.max(0, from + 1); i < steps.length; i += 1) {
      if (steps[i]?.fault) return i;
    }
    return -1;
  }

  async function onRun() {
    setError("");
    setNotice("");
    setLoading(true);
    setAutoPlay(false);
    try {
      const payload = {
        frames: clampInt(frames, { min: 1, max: 12, fallback: 3 }),
        reference: refPages,
        algorithm: algo
      };
      const data = await simulate(payload);
      setResult(data);
      setStepIndex(0);
    } catch (e) {
      setResult(null);
      setStepIndex(0);
      setError(
        String(e?.message || e) +
          "\nTip: run the API server and build the C++ binary (`npm run build:cpp`)."
      );
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    setError("");
    setNotice("");
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              Simulation setup
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Enter a reference string and visualize frame updates step-by-step.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRun}
              disabled={loading || !refPages.length || parsed.invalidTokens.length > 0}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {loading ? "Running…" : "Run"}
            </button>
            <button
              onClick={onReset}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-slate-200/70 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-50 p-3 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Quick actions:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                onLoadPreset(id);
                e.target.value = "";
              }}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm outline-none dark:bg-zinc-800"
              title="Load a preset example"
            >
              <option value="">Load preset…</option>
              {PRESET_SCENARIOS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={onRandom}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Generate a random reference string"
            >
              Random
            </button>
            <button
              onClick={onSave}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Save this setup"
            >
              Save
            </button>
            <select
              value={savedId}
              onChange={(e) => onLoadSaved(e.target.value)}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm outline-none dark:bg-zinc-800"
              title="Load a saved setup"
            >
              <option value="">Saved setups…</option>
              {savedList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={onDeleteSaved}
              disabled={!savedId}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Delete selected saved setup"
            >
              Delete
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onShare}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Copy a shareable link"
            >
              Share
            </button>
            <button
              onClick={onExport}
              disabled={!result}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Download simulation output as JSON"
            >
              Export
            </button>
          </div>
        </div>

        <details className="rounded-2xl bg-stone-50 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          <summary className="cursor-pointer select-none text-sm font-semibold">
            Quick start (recommended)
          </summary>
          <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              1) Load a preset or type numbers in “Reference string” (spaces/commas).
            </div>
            <div>2) Set Frames and pick an algorithm.</div>
            <div>3) Click Run → Next/Play to watch memory update.</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Keyboard: <span className="font-mono">←</span>/<span className="font-mono">→</span>{" "}
              to move, <span className="font-mono">Space</span> to play/pause.
            </div>
          </div>
        </details>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Frames (memory blocks)
            </span>
            <div className="grid grid-cols-[1fr,84px] gap-2">
              <input
                value={frames}
                onChange={(e) =>
                  setFrames(clampInt(e.target.value, { min: 1, max: 12, fallback: 3 }))
                }
                type="range"
                min={1}
                max={12}
                className="w-full accent-sky-700 dark:accent-zinc-100"
              />
              <input
                value={frames}
                onChange={(e) =>
                  setFrames(clampInt(e.target.value, { min: 1, max: 12, fallback: 3 }))
                }
                type="number"
                min={1}
                max={12}
                className="w-full rounded-xl bg-white px-3 py-2 text-sm shadow-sm outline-none ring-sky-500/20 focus:ring-4 dark:bg-zinc-800 dark:ring-white/10"
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Algorithm
            </span>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value)}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm shadow-sm outline-none ring-sky-500/20 focus:ring-4 dark:bg-zinc-800 dark:ring-white/10"
            >
              {ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {algo === "fifo"
                ? "FIFO: replaces the oldest page in memory."
                : algo === "lru"
                  ? "LRU: replaces the page that was used least recently."
                  : "Optimal: replaces the page used farthest in the future (best possible, but needs future knowledge)."}
            </div>
          </label>

          <label className="grid gap-1 md:col-span-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Reference string (space/comma separated)
            </span>
            <textarea
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. 7 0 1 2 0 3 0 4 2 3 0 3 2"
              rows={2}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm shadow-sm outline-none ring-sky-500/20 focus:ring-4 dark:bg-zinc-800 dark:ring-white/10"
            />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  Parsed pages:{" "}
                  <span className="font-mono">{refPages.join(", ") || "—"}</span>
                </div>
                <div className="tabular-nums">
                  Count: <span className="font-semibold">{refPages.length}</span>
                </div>
              </div>
              {parsed.invalidTokens.length ? (
                <div className="mt-1 text-zinc-800 dark:text-zinc-200">
                  Invalid tokens (remove these):{" "}
                  <span className="font-mono">
                    {parsed.invalidTokens.slice(0, 8).join(", ")}
                    {parsed.invalidTokens.length > 8 ? "…" : ""}
                  </span>
                </div>
              ) : null}
            </div>
          </label>
        </div>

        {notice ? (
          <div className="rounded-xl bg-sky-50 p-3 text-xs font-semibold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {notice}
          </div>
        ) : null}

        {error ? (
          <pre className="whitespace-pre-wrap rounded-xl bg-rose-50/80 p-3 text-xs text-rose-900/90 dark:bg-zinc-900 dark:text-zinc-200">
            {error}
          </pre>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              Step-by-step
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Use Prev/Next or enable Auto Simulation Mode.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={!steps.length || stepIndex <= 0}
              className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-200/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Prev
            </button>
            <button
              onClick={() =>
                setStepIndex((i) => Math.min(i + 1, Math.max(0, steps.length - 1)))
              }
              disabled={!steps.length || stepIndex >= steps.length - 1}
              className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-200/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Next
            </button>

            <button
              onClick={() => {
                const at = findPrevFault(stepIndex);
                if (at !== -1) {
                  setAutoPlay(false);
                  setStepIndex(at);
                }
              }}
              disabled={!steps.length || findPrevFault(stepIndex) === -1}
              className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-200/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              title="Jump to previous page fault"
            >
              Prev fault
            </button>
            <button
              onClick={() => {
                const at = findNextFault(stepIndex);
                if (at !== -1) {
                  setAutoPlay(false);
                  setStepIndex(at);
                }
              }}
              disabled={!steps.length || findNextFault(stepIndex) === -1}
              className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-200/70 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              title="Jump to next page fault"
            >
              Next fault
            </button>

            <button
              onClick={() => setAutoPlay((p) => !p)}
              disabled={!steps.length || stepIndex >= steps.length - 1}
              className={[
                "rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                autoPlay
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              ].join(" ")}
              title="Auto Simulation Mode"
            >
              {autoPlay ? "Pause" : "Play"}
            </button>

            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
              <span className="text-xs font-semibold">Step</span>
              <input
                type="range"
                min={1}
                max={Math.max(1, steps.length)}
                step={1}
                value={Math.min(steps.length, stepIndex + 1)}
                onChange={(e) => {
                  setAutoPlay(false);
                  setStepIndex(Math.max(0, Number(e.target.value) - 1));
                }}
                disabled={!steps.length}
              />
              <span className="w-16 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {steps.length ? `${stepIndex + 1}/${steps.length}` : "—"}
              </span>
            </label>

            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
              <span className="text-xs font-semibold">Speed</span>
              <input
                type="range"
                min={150}
                max={1200}
                step={50}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
              />
              <span className="w-12 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {speedMs}ms
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatPill label="Total" value={stats.total} />
          <StatPill label="Hits" value={stats.hits} tone="good" />
          <StatPill label="Faults" value={stats.faults} tone="bad" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MemoryFrames
            framesCount={Number(frames) || 0}
            current={current}
            previous={previous}
          />

          <div className="grid gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              What happened?
            </div>
            {!current ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Run a simulation to see detailed step logs here.
              </div>
            ) : (
              <div className="grid gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-white px-2 py-1 font-mono text-xs shadow-sm dark:bg-zinc-900">
                    step {current.index + 1}/{steps.length}
                  </span>
                  <span className="rounded-lg bg-white px-2 py-1 font-mono text-xs shadow-sm dark:bg-zinc-900">
                    page {current.page}
                  </span>
                  {current.fault ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      <span aria-hidden>🔴</span> page fault
                    </span>
                  ) : (
                    <span className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
                      hit
                    </span>
                  )}
                </div>

                {current.fault && current.evicted !== null ? (
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    Replaced{" "}
                    <span className="font-mono font-semibold">
                      {current.evicted}
                    </span>{" "}
                    with{" "}
                    <span className="font-mono font-semibold">{current.page}</span>.
                  </div>
                ) : null}

                <div className="rounded-xl bg-white p-3 text-xs text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
                  <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
                    Frames
                  </div>
                  <div className="font-mono">{current.frames.join(" | ")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {steps.length ? (
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              Tip: press{" "}
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
                Next
              </span>{" "}
              to see memory blocks changing.
            </div>
            <div className="tabular-nums">
              {stepIndex + 1} / {steps.length}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
