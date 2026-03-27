export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow">Learning guide</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              How to teach with the adaptive simulation lab
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use the simulator like a mission console: generate a workload, predict the next move, then confirm it with the live memory monitor.
            </div>
          </div>
          <button
            onClick={onClose}
            className="secondary-button px-4 py-2 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100">
            <div className="text-sm font-semibold">Mission flow</div>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>Choose a preset or generate an adaptive workload with the behavior controls.</li>
              <li>Set frame capacity and select an algorithm strategy.</li>
              <li>Press Run, then use Next, fault jumps, or autoplay to narrate the trace.</li>
              <li>Move to Algorithm Arena to compare which policy handled the same workload best.</li>
            </ol>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Tip: use Share to preserve the same setup for a lecture or lab handout.
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200/70 bg-slate-50/80 p-5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100">
            <div className="text-sm font-semibold">Glossary</div>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <div>
                <span className="font-semibold">Reference string:</span> the ordered stream of requested pages, such as <span className="font-mono">7 0 1 2 0</span>.
              </div>
              <div>
                <span className="font-semibold">Frame:</span> one resident slot in main memory.
              </div>
              <div>
                <span className="font-semibold">Hit:</span> the requested page is already resident, so no replacement is needed.
              </div>
              <div>
                <span className="font-semibold">Page fault:</span> the requested page is absent, so memory must load it and may evict another page.
              </div>
              <div>
                <span className="font-semibold">Locality:</span> the tendency for recently used pages to be used again soon.
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-[1.75rem] border border-slate-200/70 bg-stone-50/80 p-5 text-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Classroom ideas and troubleshooting
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Pause on a fault and ask which page each algorithm should evict before revealing the answer.</li>
            <li>Use the arena view to discuss why practical algorithms can still trail the Optimal benchmark.</li>
            <li>
              If you see API errors, start everything with <span className="font-mono">npm run dev</span>.
            </li>
            <li>
              If the status says "build C++", run <span className="font-mono">npm run build:cpp</span> once.
            </li>
            <li>
              The API should be reachable at <span className="font-mono">http://localhost:5174/api/health</span>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
