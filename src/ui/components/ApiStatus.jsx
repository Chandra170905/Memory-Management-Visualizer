import { useEffect, useState } from "react";
import { getEngineStatus } from "../../lib/api.js";

export default function ApiStatus() {
  const [state, setState] = useState({ mode: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const nextState = await getEngineStatus();
      if (!cancelled) setState(nextState);
    }

    tick();
    const id = setInterval(tick, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const meta =
    state.mode === "loading"
      ? {
          label: "Engine checking...",
          dot: "text-slate-500 dark:text-slate-300"
        }
      : state.mode === "local-cpp"
        ? {
            label: "Local C++ engine",
            dot: "text-emerald-500"
          }
        : state.mode === "local-api"
          ? {
              label: "Local API, browser sim ready",
              dot: "text-amber-500"
            }
          : {
              label: "Browser simulation mode",
              dot: "text-sky-500"
            };

  return (
    <div
      className="status-chip hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-sm sm:inline-flex"
      title="Simulation engine status"
    >
      <span className={["status-dot", meta.dot].join(" ")} />
      {meta.label}
    </div>
  );
}
