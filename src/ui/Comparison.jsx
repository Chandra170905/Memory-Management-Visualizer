import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { compare } from "../lib/api.js";
import { parseReferenceStringDetailed } from "../lib/parse.js";
import { downloadJson } from "../lib/download.js";
import { PRESET_SCENARIOS, generateRandomReference, referenceToString } from "../lib/scenarios.js";
import { addScenario, listScenarios, removeScenario } from "../lib/storage.js";
import { buildShareUrl, readShareParams } from "../lib/share.js";
import "./charts.js";
import StatPill from "./components/StatPill.jsx";

function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export default function Comparison() {
  const [frames, setFrames] = useState(3);
  const [refInput, setRefInput] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState(null);

  const parsed = useMemo(() => parseReferenceStringDetailed(refInput), [refInput]);
  const refPages = parsed.pages;

  const [savedId, setSavedId] = useState("");
  const [savedList, setSavedList] = useState(() => listScenarios("compare"));

  useEffect(() => {
    const p = readShareParams();
    if (p.tab !== "compare") return;
    setFrames(p.frames);
    if (p.refInput) setRefInput(p.refInput);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(id);
  }, [notice]);

  const chartData = useMemo(() => {
    if (!data) return null;
    const labels = ["FIFO", "LRU", "Optimal"];
    const values = [data.fifo, data.lru, data.optimal];
    return {
      labels,
      datasets: [
        {
          label: "Page faults",
          data: values,
          backgroundColor: ["#111111", "#555555", "#999999"],
          borderRadius: 12
        }
      ]
    };
  }, [data]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Faults: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }),
    []
  );

  const best = useMemo(() => {
    if (!data) return null;
    const entries = [
      ["FIFO", data.fifo],
      ["LRU", data.lru],
      ["Optimal", data.optimal]
    ];
    entries.sort((a, b) => a[1] - b[1]);
    return { algo: entries[0][0], faults: entries[0][1] };
  }, [data]);

  function refreshSaved() {
    setSavedList(listScenarios("compare"));
  }

  function onLoadPreset(id) {
    const p = PRESET_SCENARIOS.find((x) => x.id === id);
    if (!p) return;
    setData(null);
    setFrames(p.frames);
    setRefInput(referenceToString(p.reference));
    setNotice(`Loaded preset: ${p.label}`);
  }

  function onRandom() {
    setData(null);
    const ref = generateRandomReference({ length: 24, maxPage: 9, locality: 0.55 });
    setRefInput(referenceToString(ref));
    setNotice("Generated a random reference string.");
  }

  async function onShare() {
    const url = buildShareUrl({ tab: "compare", frames, refInput });
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Share link copied.");
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  function onExport() {
    if (!data) return;
    downloadJson("mmv-comparison.json", {
      exportedAt: new Date().toISOString(),
      frames: clampInt(frames, { min: 1, max: 12, fallback: 3 }),
      reference: refPages,
      result: data
    });
    setNotice("Exported JSON.");
  }

  function onSave() {
    const name = window.prompt("Save this setup as:", "My comparison");
    if (!name) return;
    addScenario({ kind: "compare", name, frames, refInput });
    refreshSaved();
    setNotice("Saved.");
  }

  function onLoadSaved(id) {
    const s = savedList.find((x) => x.id === id);
    if (!s) return;
    setData(null);
    setFrames(clampInt(s.frames, { min: 1, max: 12, fallback: 3 }));
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

  async function onCompare() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const payload = {
        frames: clampInt(frames, { min: 1, max: 12, fallback: 3 }),
        reference: refPages
      };
      const out = await compare(payload);
      setData(out);
    } catch (e) {
      setData(null);
      setError(
        String(e?.message || e) +
          "\nTip: run the API server and build the C++ binary (`npm run build:cpp`)."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              FIFO vs LRU vs Optimal
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Compare total page faults for the same reference string.
            </div>
          </div>
          <button
            onClick={onCompare}
            disabled={loading || !refPages.length || parsed.invalidTokens.length > 0}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {loading ? "Comparing…" : "Compare"}
          </button>
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
              disabled={!data}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-sky-100/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Download comparison output as JSON"
            >
              Export
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Frames
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

          <label className="grid gap-1 md:col-span-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Reference string
            </span>
            <textarea
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
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
              Comparison graph
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Lower is better (fewer faults).
            </div>
          </div>
          {best ? (
            <div className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
              Best: <span className="font-semibold">{best.algo}</span> (
              <span className="font-semibold tabular-nums">{best.faults}</span>{" "}
              faults)
            </div>
          ) : null}
        </div>

        {!chartData ? (
          <div className="rounded-2xl bg-stone-50 p-6 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            Click Compare to generate the graph.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              <StatPill label="FIFO Faults" value={data.fifo} />
              <StatPill label="LRU Faults" value={data.lru} />
              <StatPill label="Optimal Faults" value={data.optimal} />
              <div className="rounded-2xl bg-stone-50 p-4 text-xs text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Reading the chart
                </div>
                <div className="mt-1">
                  Lower bars mean fewer page faults (better). Optimal is a theoretical
                  best-case because it knows the future.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
