import { ALGORITHM_META, formatPercent } from "../../lib/education.js";

export default function WorkloadBriefing({ analysis }) {
  return (
    <div className="panel rounded-[1.75rem] p-5 sm:p-6">
      <div className="eyebrow">Behavior briefing</div>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
        {analysis.profileTitle}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {analysis.profileSummary}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="metric-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Challenge level
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {analysis.challengeLevel}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Pressure state
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
            {analysis.pressureLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Mission objective
        </div>
        <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {analysis.missionObjective}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
            <span>Locality signal</span>
            <span>{formatPercent(analysis.localityScore)}</span>
          </div>
          <div className="progress-track">
            <span className="progress-fill" style={{ width: `${analysis.localityScore}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {analysis.localityLabel}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
            <span>Reuse rate</span>
            <span>{formatPercent(analysis.reuseRate)}</span>
          </div>
          <div className="progress-track">
            <span className="progress-fill" style={{ width: `${analysis.reuseRate}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
            <span>Pressure score</span>
            <span>{formatPercent(analysis.pressureScore)}</span>
          </div>
          <div className="progress-track">
            <span
              className="progress-fill-warm"
              style={{ width: `${analysis.pressureScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="metric-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Unique pages
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
            {analysis.uniquePages}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Suggested strategy
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
            {ALGORITHM_META[analysis.recommendedAlgorithm].label}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Classroom prompt
        </div>
        <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {analysis.classroomPrompt}
        </div>
      </div>
    </div>
  );
}
