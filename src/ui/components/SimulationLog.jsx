import { ALGORITHM_META } from "../../lib/education.js";

export default function SimulationLog({
  current,
  stepsLength,
  stepStory,
  algo,
  algorithmCoach
}) {
  return (
    <div className="grid gap-6">
      <section className="panel rounded-[1.75rem] p-5 sm:p-6">
        <div className="eyebrow">Mission log</div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
          {stepStory.title}
        </h2>

        {!current ? (
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Run the mission to see a narrated explanation for each request, hit, and replacement event.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                Step {current.index + 1}/{stepsLength}
              </div>
              <div className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                Page {current.page}
              </div>
              <div className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
                {current.fault ? "Fault" : "Hit"}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {stepStory.body}
            </p>

            <div className="mt-4 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Teaching takeaway
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {stepStory.takeaway}
              </div>
            </div>

            {current.fault && current.evicted !== null ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="metric-card">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Evicted page
                  </div>
                  <div className="mt-2 font-mono text-3xl font-semibold text-slate-950 dark:text-white">
                    {current.evicted}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Replacement frame
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                    {current.replacedIndex + 1}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="panel rounded-[1.75rem] p-5 sm:p-6">
        <div className="eyebrow">Algorithm coach</div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
          {ALGORITHM_META[algo].label}: {algorithmCoach.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {algorithmCoach.note}
        </p>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Resident set snapshot
          </div>
          <div className="mt-2 font-mono text-sm leading-7 text-slate-900 dark:text-white">
            {current ? current.frames.join(" | ") : "Run a mission to populate frames."}
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-slate-950 px-5 py-4 text-white dark:border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
            Keyboard shortcuts
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-200">
            Use Left and Right to step through the timeline, and Space to toggle autoplay.
          </div>
        </div>
      </section>
    </div>
  );
}
