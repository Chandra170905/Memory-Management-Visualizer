import { useMemo } from "react";

function diffIndices(prevFrames, nextFrames) {
  const changes = new Set();
  if (!Array.isArray(prevFrames) || !Array.isArray(nextFrames)) return changes;
  const len = Math.max(prevFrames.length, nextFrames.length);
  for (let i = 0; i < len; i += 1) {
    if (prevFrames[i] !== nextFrames[i]) changes.add(i);
  }
  return changes;
}

export default function MemoryFrames({ framesCount, current, previous }) {
  const frames = current?.frames ?? Array.from({ length: framesCount }, () => null);
  const changed = useMemo(
    () => diffIndices(previous?.frames, current?.frames),
    [previous?.frames, current?.frames]
  );

  const replacedIndex = current?.replacedIndex ?? -1;

  return (
    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Memory blocks (frames)
        </div>
        {current ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {current.fault ? (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>🔴</span> fault
              </span>
            ) : (
              <span>hit</span>
            )}
          </div>
        ) : null}
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(6, Math.max(1, frames.length))}, minmax(0, 1fr))`
        }}
      >
        {frames.map((value, i) => {
          const isEmpty = value === null || value === -1;
          const isChanged = changed.has(i);
          const isReplaced = replacedIndex === i && current?.fault;
          return (
            <div
              key={`${i}-${value}-${isChanged ? "c" : "s"}`}
              className={[
                "rounded-2xl bg-white p-4 shadow-sm transition dark:bg-zinc-950",
                isChanged
                  ? "mmv-pop ring-4 ring-zinc-900/10 dark:ring-white/10"
                  : "",
                isReplaced ? "ring-4 ring-zinc-900/20 dark:ring-white/20" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Frame {i + 1}
                </div>
                {isReplaced ? (
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    replaced
                  </span>
                ) : null}
              </div>
              <div className="mt-2 text-center font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {isEmpty ? "—" : value}
              </div>
            </div>
          );
        })}
      </div>

      {current ? (
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Requested page:{" "}
          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {current.page}
          </span>
        </div>
      ) : (
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Run a simulation to populate frames.
        </div>
      )}
    </div>
  );
}
