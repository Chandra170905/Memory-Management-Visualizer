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
      ? "API: checking…"
      : state.ok
        ? state.binaryExists
          ? "API: online"
          : "API: online (build C++)"
        : "API: offline";

  const tone =
    state.ok === null
      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      : state.ok
        ? state.binaryExists
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200"
        : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200";

  return (
    <div
      className={[
        "hidden rounded-xl px-3 py-2 text-xs font-semibold shadow-sm sm:inline-flex",
        tone
      ].join(" ")}
      title="Server status (http://localhost:5174)"
    >
      {label}
    </div>
  );
}
