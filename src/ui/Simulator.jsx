import { useEffect, useMemo, useRef, useState } from "react";
import { parseReferenceStringDetailed } from "../lib/parse.js";
import { simulate } from "../lib/api.js";
import { downloadJson } from "../lib/download.js";
import {
  PRESET_SCENARIOS,
  generateRandomReference,
  referenceToString
} from "../lib/scenarios.js";
import { addScenario, listScenarios, removeScenario } from "../lib/storage.js";
import { buildShareUrl, readShareParams } from "../lib/share.js";
import {
  ALGORITHM_META,
  analyzeReference,
  buildNextCue,
  describeStep,
  getAlgorithmCoach,
  getSimulationTelemetry
} from "../lib/education.js";
import MemoryFrames from "./components/MemoryFrames.jsx";
import ReferenceTimeline from "./components/ReferenceTimeline.jsx";
import SimulationControlDeck from "./components/SimulationControlDeck.jsx";
import SimulationLog from "./components/SimulationLog.jsx";
import SimulationSetup from "./components/SimulationSetup.jsx";
import WorkloadBriefing from "./components/WorkloadBriefing.jsx";

const ALGORITHMS = Object.entries(ALGORITHM_META).map(([id, meta]) => ({
  id,
  label: meta.label
}));

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
  const [randomLength, setRandomLength] = useState(24);
  const [randomMaxPage, setRandomMaxPage] = useState(9);
  const [randomLocality, setRandomLocality] = useState(0.55);
  const [savedId, setSavedId] = useState("");
  const [savedList, setSavedList] = useState(() => listScenarios("sim"));
  const timerRef = useRef(null);

  const parsed = useMemo(() => parseReferenceStringDetailed(refInput), [refInput]);
  const refPages = parsed.pages;
  const steps = result?.steps ?? [];
  const current = steps[stepIndex] ?? null;
  const previous = stepIndex > 0 ? steps[stepIndex - 1] : null;

  const stats = useMemo(() => {
    if (!steps.length) return { faults: 0, hits: 0, total: 0 };
    let faults = 0;
    let hits = 0;
    for (const step of steps) {
      if (step.fault) faults += 1;
      else hits += 1;
    }
    return { faults, hits, total: steps.length };
  }, [steps]);

  const analysis = useMemo(() => analyzeReference(refPages, frames), [refPages, frames]);
  const telemetry = useMemo(() => getSimulationTelemetry(steps, stepIndex), [steps, stepIndex]);
  const stepStory = useMemo(() => describeStep({ current, algo }), [current, algo]);
  const nextCue = useMemo(() => buildNextCue(steps, stepIndex), [steps, stepIndex]);
  const algorithmCoach = useMemo(() => getAlgorithmCoach(algo, analysis), [algo, analysis]);

  useEffect(() => {
    const params = readShareParams();
    if (params.tab !== "sim") return;
    setFrames(params.frames);
    if (params.algo && ["fifo", "lru", "optimal"].includes(params.algo)) setAlgo(params.algo);
    if (params.refInput) setRefInput(params.refInput);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!autoPlay || !steps.length || stepIndex >= steps.length - 1) return undefined;
    timerRef.current = setTimeout(() => {
      setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    }, speedMs);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [autoPlay, stepIndex, steps.length, speedMs]);

  useEffect(() => {
    if (!steps.length) setAutoPlay(false);
  }, [steps.length]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!steps.length) return;
      const tag = String(event?.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setAutoPlay(false);
        setStepIndex((index) => Math.max(0, index - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setAutoPlay(false);
        setStepIndex((index) => Math.min(index + 1, Math.max(0, steps.length - 1)));
      } else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (stepIndex >= steps.length - 1) return;
        setAutoPlay((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps.length, stepIndex]);

  function refreshSaved() {
    setSavedList(listScenarios("sim"));
  }

  function onLoadSaved(id) {
    const item = savedList.find((entry) => entry.id === id);
    if (!item) return;
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    setFrames(clampInt(item.frames, 1, 12, 3));
    if (item.algo && ["fifo", "lru", "optimal"].includes(item.algo)) setAlgo(item.algo);
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
    setNotice("Saved setup removed.");
  }

  function findPrevFault(from) {
    for (let index = Math.min(from - 1, steps.length - 1); index >= 0; index -= 1) {
      if (steps[index]?.fault) return index;
    }
    return -1;
  }

  function findNextFault(from) {
    for (let index = Math.max(0, from + 1); index < steps.length; index += 1) {
      if (steps[index]?.fault) return index;
    }
    return -1;
  }

  async function onRun() {
    setError("");
    setNotice("");
    setLoading(true);
    setAutoPlay(false);
    try {
      const data = await simulate({
        frames: clampInt(frames, 1, 12, 3),
        reference: refPages,
        algorithm: algo
      });
      setResult(data);
      setStepIndex(0);
    } catch (exception) {
      setResult(null);
      setStepIndex(0);
      setError(
        String(exception?.message || exception) +
          "\nTip: the app now runs in browser simulation mode by default. If you want the optional local C++ engine, start the API server and run `npm run build:cpp`."
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

  function onRandom() {
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    const reference = generateRandomReference({
      length: randomLength,
      maxPage: randomMaxPage,
      locality: randomLocality
    });
    setRefInput(referenceToString(reference));
    setNotice("Generated an adaptive behavior trace.");
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
    downloadJson("adaptive-simulation.json", {
      exportedAt: new Date().toISOString(),
      frames: clampInt(frames, 1, 12, 3),
      algorithm: algo,
      reference: refPages,
      result
    });
    setNotice("Simulation exported.");
  }

  function onSave() {
    const name = window.prompt("Save this setup as:", "Mission setup");
    if (!name) return;
    addScenario({ kind: "sim", name, frames, algo, refInput });
    refreshSaved();
    setNotice("Setup saved.");
  }

  const handleLoadPreset = (id) => {
    const preset = PRESET_SCENARIOS.find((item) => item.id === id);
    if (!preset) return;
    setAutoPlay(false);
    setResult(null);
    setStepIndex(0);
    setFrames(preset.frames);
    setRefInput(referenceToString(preset.reference));
    setRandomLength(preset.reference.length);
    setRandomMaxPage(Math.max(...preset.reference));
    setNotice(`Loaded preset: ${preset.label}`);
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SimulationSetup
          loading={loading}
          frames={frames}
          setFrames={(value) => setFrames(clampInt(value, 1, 12, 3))}
          algo={algo}
          setAlgo={setAlgo}
          algorithms={ALGORITHMS}
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
          onLoadPreset={handleLoadPreset}
          onLoadSaved={onLoadSaved}
          onDeleteSaved={onDeleteSaved}
          onRandom={onRandom}
          onSave={onSave}
          onShare={onShare}
          onExport={onExport}
          onRun={onRun}
          onReset={onReset}
          hasResult={!!result}
        />
        <WorkloadBriefing analysis={analysis} />
      </section>

      <ReferenceTimeline
        reference={refPages}
        steps={steps.length ? steps : null}
        currentIndex={steps.length ? stepIndex : null}
        title="Workload timeline"
        subtitle="Processed requests update from neutral to hit or fault, making the behavior pattern easier to teach."
      />

      <SimulationControlDeck
        steps={steps}
        stepIndex={stepIndex}
        setStepIndex={setStepIndex}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
        speedMs={speedMs}
        setSpeedMs={setSpeedMs}
        telemetry={telemetry}
        stats={stats}
        nextCue={nextCue}
        findPrevFault={findPrevFault}
        findNextFault={findNextFault}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <MemoryFrames
          framesCount={Number(frames) || 0}
          current={current}
          previous={previous}
          algo={algo}
        />
        <SimulationLog
          current={current}
          stepsLength={steps.length}
          stepStory={stepStory}
          algo={algo}
          algorithmCoach={algorithmCoach}
        />
      </section>
    </div>
  );
}
