export default function StatPill({ label, value, tone = "neutral", note = "" }) {
  const toneClass =
    tone === "good"
      ? "metric-good"
      : tone === "bad"
        ? "metric-bad"
        : tone === "accent"
          ? "metric-accent"
          : "";

  return (
    <div className={["metric-card", toneClass].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {label}
          </div>
          {note ? (
            <div className="mt-2 max-w-[12rem] text-xs leading-5 text-slate-600 dark:text-slate-300">
              {note}
            </div>
          ) : null}
        </div>
        <div className="text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}
