import { useEffect, useState } from "react";

export default function ApiStatus() {
  const [state, setState] = useState({ ok: null, binaryExists: null });

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) throw new Error("bad");
        const data = await res.json();
        if (!cancelled) setState({ ok: true, binaryExists: !!data?.binaryExists });
      } catch {
        if (!cancelled) setState({ ok: false, binaryExists: null });
      }
    }

    tick();
    const id = setInterval(tick, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const label =
    state.ok === null
      ? "Engine checking..."
      : state.ok
        ? state.binaryExists
          ? "Engine online"
          : "API online, build C++"
        : "Engine offline";

  const toneClass =
    state.ok === null
      ? "text-slate-500 dark:text-slate-300"
      : state.ok
        ? state.binaryExists
          ? "text-emerald-500"
          : "text-amber-500"
        : "text-rose-500";

  return (
    <div
      className="status-chip hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-sm sm:inline-flex"
      title="Server status (http://localhost:5174)"
    >
      <span className={["status-dot", toneClass].join(" ")} />
      {label}
    </div>
  );
}
