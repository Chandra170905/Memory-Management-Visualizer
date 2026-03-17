function clampInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function buildShareUrl({ tab, frames, algo, refInput }) {
  const url = new URL(window.location.href);
  const sp = url.searchParams;

  sp.set("tab", tab === "compare" ? "compare" : "sim");
  sp.set("frames", String(clampInt(frames, { min: 1, max: 12, fallback: 3 })));
  if (algo) sp.set("algo", String(algo));
  else sp.delete("algo");

  const ref = String(refInput || "").trim();
  if (ref) sp.set("ref", ref);
  else sp.delete("ref");

  url.search = sp.toString();
  return url.toString();
}

export function readShareParams() {
  const sp = new URLSearchParams(window.location.search);
  const tab = sp.get("tab") === "compare" ? "compare" : "sim";
  const frames = clampInt(sp.get("frames"), { min: 1, max: 12, fallback: 3 });
  const algo = sp.get("algo");
  const refInput = sp.get("ref") || "";
  return { tab, frames, algo, refInput };
}

export function setTabParam(tab) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab === "compare" ? "compare" : "sim");
  window.history.replaceState({}, "", url.toString());
}

