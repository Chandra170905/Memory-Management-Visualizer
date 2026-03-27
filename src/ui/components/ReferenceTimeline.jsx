function getTokenState(index, steps, currentIndex) {
  if (!Array.isArray(steps) || currentIndex === null || currentIndex === undefined) {
    return "token-idle";
  }

  if (index < currentIndex) {
    return steps[index]?.fault ? "token-fault" : "token-hit";
  }

  if (index === currentIndex) {
    return steps[index]?.fault ? "token-current-fault" : "token-current-hit";
  }

  return "token-upcoming";
}

export default function ReferenceTimeline({
  reference,
  steps = null,
  currentIndex = null,
  title = "Reference stream",
  subtitle = "Observe how each request moves through memory."
}) {
  const pages = Array.isArray(reference) ? reference : [];

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Behavior trace</div>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        </div>
        <div className="rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300">
          {pages.length} requests
        </div>
      </div>

      {!pages.length ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300/80 bg-white/60 px-4 py-5 text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-950/45 dark:text-slate-400">
          Generate or enter a reference string to render the behavior timeline.
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {pages.map((page, index) => (
            <div
              key={`${index}-${page}`}
              className={`token-chip ${getTokenState(index, steps, currentIndex)}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-60">
                {index + 1}
              </span>
              <span className="font-mono text-base font-semibold">{page}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="legend-chip">Processed hit</span>
        <span className="legend-chip">Processed fault</span>
        <span className="legend-chip">Current request</span>
        <span className="legend-chip">Upcoming</span>
      </div>
    </section>
  );
}
