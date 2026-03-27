import { useEffect, useMemo, useState } from "react";
import { compare } from "../lib/api.js";
import { parseReferenceStringDetailed } from "../lib/parse.js";
import { downloadJson } from "../lib/download.js";
import {
  PRESET_SCENARIOS,
  generateRandomReference,
  referenceToString
} from "../lib/scenarios.js";
import { addScenario, listScenarios, removeScenario } from "../lib/storage.js";
import { buildShareUrl, readShareParams } from "../lib/share.js";
import {
  analyzeReference,
  buildComparisonTakeaway,
  rankAlgorithms
} from "../lib/education.js";
import "./charts.js";
import ArenaResults from "./components/ArenaResults.jsx";
import ComparisonSetup from "./components/ComparisonSetup.jsx";
import ReferenceTimeline from "./components/ReferenceTimeline.jsx";
import WorkloadBriefing from "./components/WorkloadBriefing.jsx";

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function clampDecimal(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default function Comparison() {
  const [frames, setFrames] = useState(3);
  const [refInput, setRefInput] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState(null);
  const [randomLength, setRandomLength] = useState(24);
  const [randomMaxPage, setRandomMaxPage] = useState(9);
  const [randomLocality, setRandomLocality] = useState(0.55);
  const [savedId, setSavedId] = useState("");
  const [savedList, setSavedList] = useState(() => listScenarios("compare"));

  const parsed = useMemo(() => parseReferenceStringDetailed(refInput), [refInput]);
  const refPages = parsed.pages;
  const analysis = useMemo(() => analyzeReference(refPages, frames), [refPages, frames]);
  const ranking = useMemo(() => rankAlgorithms(data, refPages.length), [data, refPages.length]);
  const takeaway = useMemo(
    () => buildComparisonTakeaway(ranking, analysis),
    [ranking, analysis]
  );

  useEffect(() => {
    const params = readShareParams();
    if (params.tab !== "compare") return;
    setFrames(params.frames);
    if (params.refInput) setRefInput(params.refInput);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(id);
  }, [notice]);

  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: ["FIFO", "LRU", "Optimal"],
      datasets: [
        {
          label: "Page faults",
          data: [data.fifo, data.lru, data.optimal],
          backgroundColor: ["#38bdf8", "#2dd4bf", "#fb923c"],
          borderRadius: 18
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
            label: (context) => `Faults: ${context.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(148,163,184,0.18)" }
        },
        x: { grid: { display: false } }
      }
    }),
    []
  );

  function refreshSaved() {
    setSavedList(listScenarios("compare"));
  }

  function onLoadPreset(id) {
    const preset = PRESET_SCENARIOS.find((item) => item.id === id);
    if (!preset) return;
    setData(null);
    setFrames(preset.frames);
    setRefInput(referenceToString(preset.reference));
    setRandomLength(preset.reference.length);
    setRandomMaxPage(Math.max(...preset.reference));
    setNotice(`Loaded preset: ${preset.label}`);
  }

  function onRandom() {
    setData(null);
    const reference = generateRandomReference({
      length: randomLength,
      maxPage: randomMaxPage,
      locality: randomLocality
    });
    setRefInput(referenceToString(reference));
    setNotice("Generated an adaptive arena workload.");
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
    downloadJson("adaptive-comparison.json", {
      exportedAt: new Date().toISOString(),
      frames: clampInt(frames, 1, 12, 3),
      reference: refPages,
      result: data
    });
    setNotice("Comparison exported.");
  }

  function onSave() {
    const name = window.prompt("Save this setup as:", "Arena setup");
    if (!name) return;
    addScenario({ kind: "compare", name, frames, refInput });
    refreshSaved();
    setNotice("Arena saved.");
  }

  function onLoadSaved(id) {
    const item = savedList.find((entry) => entry.id === id);
    if (!item) return;
    setData(null);
    setFrames(clampInt(item.frames, 1, 12, 3));
    setRefInput(String(item.refInput || ""));
    setSavedId(id);
    setNotice(`Loaded: ${item.name}`);
  }

  function onDeleteSaved() {
    if (!savedId) return;
    const item = savedList.find((entry) => entry.id === savedId);
    const ok = window.confirm(`Delete saved setup "${item?.name || "Untitled"}"?`);
    if (!ok) return;
    removeScenario(savedId);
    setSavedId("");
    refreshSaved();
    setNotice("Saved arena removed.");
  }

  async function onCompare() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const out = await compare({
        frames: clampInt(frames, 1, 12, 3),
        reference: refPages
      });
      setData(out);
    } catch (exception) {
      setData(null);
      setError(
        String(exception?.message || exception) +
          "\nTip: the app now runs in browser simulation mode by default. If you want the optional local C++ engine, start the API server and run `npm run build:cpp`."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <ComparisonSetup
          loading={loading}
          frames={frames}
          setFrames={(value) => setFrames(clampInt(value, 1, 12, 3))}
          refInput={refInput}
          setRefInput={setRefInput}
          refPages={refPages}
          parsed={parsed}
          notice={notice}
          error={error}
          randomLength={randomLength}
          setRandomLength={(value) => setRandomLength(clampInt(value, 8, 40, 24))}
          randomMaxPage={randomMaxPage}
          setRandomMaxPage={(value) => setRandomMaxPage(clampInt(value, 3, 15, 9))}
          randomLocality={randomLocality}
          setRandomLocality={(value) => setRandomLocality(clampDecimal(value, 0.1, 0.95, 0.55))}
          savedId={savedId}
          savedList={savedList}
          onLoadPreset={onLoadPreset}
          onLoadSaved={onLoadSaved}
          onDeleteSaved={onDeleteSaved}
          onRandom={onRandom}
          onSave={onSave}
          onShare={onShare}
          onExport={onExport}
          onCompare={onCompare}
          hasData={!!data}
        />
        <WorkloadBriefing analysis={analysis} />
      </section>

      <ReferenceTimeline
        reference={refPages}
        title="Arena workload timeline"
        subtitle="Use the same workload across all algorithms so the leaderboard stays fair and easy to explain."
      />

      <ArenaResults
        chartData={chartData}
        chartOptions={chartOptions}
        ranking={ranking}
        takeaway={takeaway}
        referenceLength={refPages.length}
      />
    </div>
  );
}
