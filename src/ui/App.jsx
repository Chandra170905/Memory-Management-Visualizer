import { useEffect, useMemo, useState } from "react";
import Simulator from "./Simulator.jsx";
import Comparison from "./Comparison.jsx";
import { MoonIcon, SunIcon } from "./icons.jsx";
import HelpModal from "./components/HelpModal.jsx";
import ApiStatus from "./components/ApiStatus.jsx";
import { readShareParams, setTabParam } from "../lib/share.js";

function getInitialTheme() {
  const stored = localStorage.getItem("mmv:theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [tab, setTab] = useState(() => readShareParams().tab);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("mmv:theme", theme);
  }, [theme]);

  useEffect(() => {
    setTabParam(tab);
  }, [tab]);

  const tabs = useMemo(
    () => [
      { id: "sim", label: "Simulator" },
      { id: "compare", label: "Comparison" }
    ],
    []
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              <span className="text-sm font-semibold tracking-wide">MM</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">
                Memory Management Visualizer
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                Paging • FIFO/LRU/Optimal • Step-by-step • Auto mode
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ApiStatus />
            <nav className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 text-sm dark:bg-zinc-900 md:flex">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={[
                    "rounded-lg px-3 py-1.5 transition",
                    tab === t.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-white/70 dark:text-zinc-200 dark:hover:bg-white/10"
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-slate-200/70 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-white/10"
              aria-label="Open help"
              title="Help"
            >
              Help
            </button>

            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-zinc-800 shadow-sm transition hover:bg-slate-200/70 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-white/10"
              aria-label="Toggle dark mode"
              title="Dark mode"
            >
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
              <span className="hidden sm:inline">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid gap-4 rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Visualize paging in real time</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Page faults are marked with{" "}
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>🔴</span>
                  <span className="font-medium">fault</span>
                </span>
                . Step through manually or use Auto Simulation Mode.
              </div>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={[
                    "rounded-xl bg-slate-100 px-3 py-2 text-sm transition dark:bg-zinc-900",
                    tab === t.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-slate-200/70 dark:text-zinc-200 dark:hover:bg-white/10"
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === "sim" ? <Simulator /> : <Comparison />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-zinc-600 dark:text-zinc-400">
        Built with React + Tailwind + Chart.js. Algorithms run in C++ via a local API.
      </footer>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
