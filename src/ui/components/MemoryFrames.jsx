import { useMemo } from "react";

function diffIndices(prevFrames, nextFrames) {
  const changes = new Set();
  if (!Array.isArray(prevFrames) || !Array.isArray(nextFrames)) return changes;

  const len = Math.max(prevFrames.length, nextFrames.length);
  for (let index = 0; index < len; index += 1) {
    if (prevFrames[index] !== nextFrames[index]) changes.add(index);
  }

  return changes;
}

export default function MemoryFrames({ framesCount, current, previous, algo = "fifo" }) {
  const frames = current?.frames ?? Array.from({ length: framesCount }, () => null);
  const changed = useMemo(
    () => diffIndices(previous?.frames, current?.frames),
    [previous?.frames, current?.frames]
  );
  const replacedIndex = current?.replacedIndex ?? -1;
  const filledFrames = frames.filter((value) => value !== null && value !== -1).length;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Resident set monitor</div>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
            Memory frame matrix
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Watch each frame behave like a monitored resource. Replacements glow when the workload forces memory pressure.
          </p>
        </div>
        <div className="grid gap-2 text-right text-xs text-slate-500 dark:text-slate-400">
          <div className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 font-semibold uppercase tracking-[0.22em] dark:border-slate-700/70 dark:bg-slate-900/70">
            {algo.toUpperCase()}
          </div>
          <div>
            Occupancy:{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filledFrames}/{frames.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, frames.length))}, minmax(0, 1fr))`
          }}
        >
          {frames.map((value, index) => {
            const isEmpty = value === null || value === -1;
            const isChanged = changed.has(index);
            const isReplaced = replacedIndex === index && current?.fault;

            return (
              <div
                key={`${index}-${value}-${isChanged ? "changed" : "steady"}`}
                className={[
                  "memory-slot",
                  isEmpty ? "memory-slot-empty" : "",
                  isChanged ? "memory-slot-changed mmv-pop" : "",
                  isReplaced ? "memory-slot-replaced" : ""
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Frame {index + 1}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isReplaced ? "Replaced" : isChanged ? "Updated" : "Stable"}
                  </div>
                </div>
                <div className="mt-4 flex h-16 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="font-mono text-3xl font-semibold text-slate-950 dark:text-white">
                    {isEmpty ? "-" : value}
                  </span>
                </div>
                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  {isEmpty
                    ? "Available capacity"
                    : isReplaced
                      ? "This slot absorbed the latest page fault."
                      : "Resident page remains available."}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-slate-950 px-5 py-4 text-white shadow-lg shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
              Incoming request
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-sm text-slate-300">Requested page</div>
                <div className="mt-1 font-mono text-4xl font-semibold">
                  {current ? current.page : "-"}
                </div>
              </div>
              <div className="text-right text-sm text-slate-300">
                <div>Status</div>
                <div className="mt-1 font-semibold text-white">
                  {!current ? "Waiting" : current.fault ? "Fault" : "Hit"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Live cue
            </div>
            <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {current ? (
                current.fault ? (
                  <>
                    Page <span className="font-mono font-semibold">{current.page}</span> forced memory to adapt. Frame{" "}
                    <span className="font-semibold">{current.replacedIndex + 1}</span> is the slot to discuss with students.
                  </>
                ) : (
                  <>
                    Page <span className="font-mono font-semibold">{current.page}</span> was already resident, so the algorithm preserved the current layout and saved a replacement.
                  </>
                )
              ) : (
                "Run the mission to start streaming frame activity into the monitor."
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
