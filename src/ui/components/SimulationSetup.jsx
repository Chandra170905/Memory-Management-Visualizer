import { PRESET_SCENARIOS } from "../../lib/scenarios.js";
import { formatPercent } from "../../lib/education.js";

export default function SimulationSetup({
  loading,
  frames,
  setFrames,
  algo,
  setAlgo,
  algorithms,
  refInput,
  setRefInput,
  refPages,
  parsed,
  notice,
  error,
  randomLength,
  setRandomLength,
  randomMaxPage,
  setRandomMaxPage,
  randomLocality,
  setRandomLocality,
  savedId,
  savedList,
  onLoadPreset,
  onLoadSaved,
  onDeleteSaved,
  onRandom,
  onSave,
  onShare,
  onExport,
  onRun,
  onReset,
  hasResult
}) {
  return (
    <div className="panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Mission builder</div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            Adaptive process setup
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Create a workload, tune the memory budget, and launch a live process-monitoring lesson for page replacement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRun}
            disabled={loading || !refPages.length || parsed.invalidTokens.length > 0}
            className="primary-button px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Running..." : "Run mission"}
          </button>
          <button onClick={onReset} className="secondary-button px-5 py-3 text-sm font-semibold">
            Clear
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">
            Quick actions
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Load, save, share, or export a lesson scenario.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              defaultValue=""
              onChange={(event) => {
                const id = event.target.value;
                if (!id) return;
                onLoadPreset(id);
                event.target.value = "";
              }}
              className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Load mission preset...</option>
              {PRESET_SCENARIOS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>

            <div className="grid gap-3 md:grid-cols-[1fr,auto]">
              <select
                value={savedId}
                onChange={(event) => onLoadSaved(event.target.value)}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Saved setups...</option>
                {savedList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onDeleteSaved}
                disabled={!savedId}
                className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onRandom} className="secondary-button px-4 py-3 text-sm font-semibold">
              Generate trace
            </button>
            <button onClick={onSave} className="secondary-button px-4 py-3 text-sm font-semibold">
              Save
            </button>
            <button onClick={onShare} className="secondary-button px-4 py-3 text-sm font-semibold">
              Share
            </button>
            <button
              onClick={onExport}
              disabled={!hasResult}
              className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/45">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-950 dark:text-white">
            Adaptive behavior generator
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Simulate different process behaviors before you run the engine.
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Trace length
            </span>
            <input
              type="range"
              min={8}
              max={40}
              value={randomLength}
              onChange={(event) => setRandomLength(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {randomLength} requests
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Page range
            </span>
            <input
              type="range"
              min={3}
              max={15}
              value={randomMaxPage}
              onChange={(event) => setRandomMaxPage(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Pages 0 to {randomMaxPage}
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Locality bias
            </span>
            <input
              type="range"
              min={0.1}
              max={0.95}
              step={0.05}
              value={randomLocality}
              onChange={(event) => setRandomLocality(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {formatPercent(randomLocality * 100)}
            </div>
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Frames
            </span>
            <div className="grid grid-cols-[1fr,90px] gap-3">
              <input
                value={frames}
                onChange={(event) => setFrames(Number(event.target.value))}
                type="range"
                min={1}
                max={12}
                className="w-full accent-sky-600"
              />
              <input
                value={frames}
                onChange={(event) => setFrames(Number(event.target.value))}
                type="number"
                min={1}
                max={12}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Replacement strategy
            </span>
            <select
              value={algo}
              onChange={(event) => setAlgo(event.target.value)}
              className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {algorithms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Reference string
          </span>
          <textarea
            value={refInput}
            onChange={(event) => setRefInput(event.target.value)}
            placeholder="Example: 7 0 1 2 0 3 0 4 2 3 0 3 2"
            rows={3}
            className="rounded-[1.5rem] border border-slate-200/70 bg-white px-4 py-4 text-sm text-slate-900 outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Parsed pages:{" "}
              <span className="font-mono text-slate-900 dark:text-white">
                {refPages.join(", ") || "-"}
              </span>
            </div>
            <div>
              Count:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {refPages.length}
              </span>
            </div>
          </div>
          {parsed.invalidTokens.length ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-950/60 dark:bg-rose-950/20 dark:text-rose-300">
              Invalid tokens: <span className="font-mono">{parsed.invalidTokens.slice(0, 10).join(", ")}</span>
            </div>
          ) : null}
        </label>
      </div>

      {notice ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-200">
          {notice}
        </div>
      ) : null}

      {error ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-950/60 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </pre>
      ) : null}
    </div>
  );
}
