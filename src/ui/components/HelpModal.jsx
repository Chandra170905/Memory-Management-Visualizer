export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">Quick help</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Beginner-friendly guide to run simulations and understand results.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-slate-50 p-4 text-sm text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="text-sm font-semibold">How to use</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
              <li>Pick a preset (or type your own reference string).</li>
              <li>Choose how many frames (memory blocks) you have.</li>
              <li>Click Run, then use Next/Play to watch frames update.</li>
              <li>Switch to Comparison to see total faults for all algorithms.</li>
            </ol>
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Tip: use the Share button to copy a link that re-opens the same setup.
            </div>
          </section>

          <section className="rounded-2xl bg-slate-50 p-4 text-sm text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="text-sm font-semibold">Glossary</div>
            <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div>
                <span className="font-semibold">Reference string:</span> the sequence of
                requested pages (example: <span className="font-mono">7 0 1 2 0</span>).
              </div>
              <div>
                <span className="font-semibold">Frame:</span> one slot in memory that can hold
                one page.
              </div>
              <div>
                <span className="font-semibold">Hit:</span> page already in a frame (no
                replacement).
              </div>
              <div>
                <span className="font-semibold">Page fault:</span> page not in memory, so the
                algorithm loads it (may replace another page).
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Troubleshooting
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>
              If you see API errors, start everything with{" "}
              <span className="font-mono">npm run dev</span>.
            </li>
            <li>
              If the status says “build C++”, run{" "}
              <span className="font-mono">npm run build:cpp</span> once.
            </li>
            <li>
              The API should be reachable at{" "}
              <span className="font-mono">http://localhost:5174/api/health</span>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
