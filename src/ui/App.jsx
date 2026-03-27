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

const TAB_META = {
  sim: {
    label: "Mission Simulator",
    title: "Live process monitoring for page replacement",
    description:
      "Run an adaptive memory mission, trace every page request, and narrate each replacement in a classroom-friendly flow."
  },
  compare: {
    label: "Algorithm Arena",
    title: "Gamified comparison of FIFO, LRU, and Optimal",
    description:
      "Pit all three strategies against the same workload and turn fault counts into a visual scoreboard learners can discuss."
  }
};

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
      { id: "sim", label: "Mission Simulator" },
      { id: "compare", label: "Algorithm Arena" }
    ],
    []
  );

  const activeTab = TAB_META[tab] || TAB_META.sim;

  return (
    <div className="app-shell min-h-dvh">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="app-orb app-orb-one" />
        <div className="app-orb app-orb-two" />
        <div className="app-grid" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="logo-chip">ABS</div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Gamified Interactive Process Monitoring System
              </div>
              <div className="text-sm font-semibold text-white sm:text-base">
                Adaptive Behavioral Simulation Lab
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ApiStatus />
            <button
              onClick={() => setHelpOpen(true)}
              className="ghost-button px-4 py-2 text-sm font-semibold text-white"
            >
              Guide
            </button>
            <button
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
              className="ghost-button inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <MoonIcon /> : <SunIcon />}
              <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="hero-panel rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
            <div className="relative z-10">
              <div className="eyebrow">Adaptive Behavioral Simulation for memory education</div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Turn page replacement into a visual mission students can predict, monitor, and master.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
                This upgraded experience reframes memory management like a live operations console. Learners can explore workload behavior, watch page faults unfold frame by frame, and compare strategies through a game-like teaching flow.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={[
                      "tab-button px-5 py-3 text-sm font-semibold",
                      tab === item.id ? "tab-button-active" : ""
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="metric-card">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Observe
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    Live frame states
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Every memory slot updates in real time so replacement choices are easy to follow.
                  </div>
                </div>
                <div className="metric-card">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Predict
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    Adaptive workloads
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Generate traces with configurable locality, page range, and sequence length.
                  </div>
                </div>
                <div className="metric-card">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Compare
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    Arena scoreboard
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Convert total faults into a visual ranking for classroom discussion.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="metric-card">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Current mode
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  {activeTab.label}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {activeTab.description}
                </div>
              </div>
              <div className="metric-card">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Teaching outcome
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  Understand memory pressure with visuals instead of abstract tables.
                </div>
              </div>
              <div className="metric-card">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Industry fit
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Designed for labs, demos, project showcases, and education-industry explainers where clarity and engagement matter.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="panel panel-strong rounded-[1.75rem] p-5 sm:p-6">
            <div className="eyebrow">Experience layer</div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {activeTab.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {activeTab.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="metric-card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Learning loop
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Generate, predict, reveal, compare, repeat.
              </div>
            </div>
            <div className="metric-card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Visual language
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Mission-control framing helps learners read hits, faults, and replacements faster.
              </div>
            </div>
            <div className="metric-card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Engine
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Existing React and C++ simulator logic stays intact beneath the upgraded interface.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6">{tab === "sim" ? <Simulator /> : <Comparison />}</div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-xs text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
        Adaptive Behavioral Simulation Lab for memory management education. Powered by React, Tailwind, Chart.js, and the local C++ simulation engine.
      </footer>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
