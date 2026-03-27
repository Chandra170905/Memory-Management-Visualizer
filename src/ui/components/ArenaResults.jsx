import { Bar } from "react-chartjs-2";
import StatPill from "./StatPill.jsx";

export default function ArenaResults({
  chartData,
  chartOptions,
  ranking,
  takeaway,
  referenceLength
}) {
  const best = ranking[0];
  const worst = ranking[ranking.length - 1];
  const spread = ranking.length ? worst.faults - best.faults : 0;

  return (
    <section className="panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Arena scoreboard</div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            Algorithm performance snapshot
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Use the ranking and chart together so students can connect raw fault totals to practical algorithm behavior.
          </p>
        </div>
        {best ? (
          <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Winner: {best.label}
          </div>
        ) : null}
      </div>

      {!chartData ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="arena-card">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">FIFO</div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A simple queue-based baseline that is easy to explain in early lessons.
            </div>
          </div>
          <div className="arena-card">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">LRU</div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Tracks recent behavior, making it a strong teaching bridge from locality theory to practice.
            </div>
          </div>
          <div className="arena-card">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Optimal</div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Serves as the theoretical benchmark that practical strategies try to approach.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatPill label="Best faults" value={best.faults} tone="good" />
            <StatPill label="Spread" value={spread} note="Gap between best and worst policy." />
            <StatPill label="Trace length" value={referenceLength} tone="accent" />
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/65 p-4 dark:border-slate-800 dark:bg-slate-950/45">
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="grid gap-3">
              {ranking.map((entry) => (
                <div
                  key={entry.id}
                  className={[
                    "arena-card",
                    entry.rank === 1 ? "arena-card-top" : ""
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Rank {entry.rank}
                      </div>
                      <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                        {entry.label}
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-white">
                      {entry.faults} faults
                    </div>
                  </div>

                  <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {entry.note}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <span>Efficiency</span>
                      <span>{entry.efficiency}%</span>
                    </div>
                    <div className="progress-track">
                      <span className="progress-fill" style={{ width: `${entry.efficiency}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-slate-950 px-5 py-4 text-white dark:border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
              Instructor takeaway
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-200">{takeaway}</div>
          </div>
        </>
      )}
    </section>
  );
}
