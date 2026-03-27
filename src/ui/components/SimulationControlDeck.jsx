import { formatPercent } from "../../lib/education.js";
import StatPill from "./StatPill.jsx";

export default function SimulationControlDeck({
  steps,
  stepIndex,
  setStepIndex,
  autoPlay,
  setAutoPlay,
  speedMs,
  setSpeedMs,
  telemetry,
  stats,
  nextCue,
  findPrevFault,
  findNextFault
}) {
  return (
    <section className="panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Control deck</div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            Playback and mission telemetry
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Step manually, jump between page faults, or autoplay the trace for a full process-monitoring walkthrough.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={!steps.length || stepIndex <= 0}
            className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Prev
          </button>
          <button
            onClick={() =>
              setStepIndex((index) => Math.min(index + 1, Math.max(0, steps.length - 1)))
            }
            disabled={!steps.length || stepIndex >= steps.length - 1}
            className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
          <button
            onClick={() => {
              const target = findPrevFault(stepIndex);
              if (target !== -1) {
                setAutoPlay(false);
                setStepIndex(target);
              }
            }}
            disabled={!steps.length || findPrevFault(stepIndex) === -1}
            className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Prev fault
          </button>
          <button
            onClick={() => {
              const target = findNextFault(stepIndex);
              if (target !== -1) {
                setAutoPlay(false);
                setStepIndex(target);
              }
            }}
            disabled={!steps.length || findNextFault(stepIndex) === -1}
            className="secondary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next fault
          </button>
          <button
            onClick={() => setAutoPlay((value) => !value)}
            disabled={!steps.length || stepIndex >= steps.length - 1}
            className="primary-button px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {autoPlay ? "Pause" : "Autoplay"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
          <label className="grid gap-2">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
              <span>Mission position</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {steps.length ? `${stepIndex + 1}/${steps.length}` : "-"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, steps.length)}
              step={1}
              value={Math.min(steps.length, stepIndex + 1) || 1}
              onChange={(event) => {
                setAutoPlay(false);
                setStepIndex(Math.max(0, Number(event.target.value) - 1));
              }}
              disabled={!steps.length}
              className="w-full accent-sky-600"
            />
          </label>

          <label className="grid gap-2">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
              <span>Playback speed</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{speedMs} ms</span>
            </div>
            <input
              type="range"
              min={150}
              max={1200}
              step={50}
              value={speedMs}
              onChange={(event) => setSpeedMs(Number(event.target.value))}
              className="w-full accent-sky-600"
            />
          </label>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-950 px-5 py-4 text-white dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
            Next cue
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-200">{nextCue}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatPill label="Progress" value={formatPercent(telemetry.progressPercent)} tone="accent" />
        <StatPill label="Mission score" value={formatPercent(telemetry.missionScore)} note="Combines hit and fault behavior." />
        <StatPill label="Hits" value={stats.hits} tone="good" />
        <StatPill label="Faults" value={stats.faults} tone="bad" />
        <StatPill
          label="Hit streak"
          value={telemetry.hitStreak}
          note={telemetry.hitStreak ? "Current streak of successful resident reuse." : "No active hit streak yet."}
        />
      </div>
    </section>
  );
}
