export default function StatPill({ label, value, tone }) {
  const toneClass =
    tone === "good"
      ? "bg-sky-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
      : tone === "bad"
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "bg-slate-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className={["rounded-2xl p-4 shadow-sm", toneClass].join(" ")}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
