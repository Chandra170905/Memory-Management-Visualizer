export const PRESET_SCENARIOS = [
  {
    id: "classic",
    label: "Classic example",
    frames: 3,
    reference: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
  },
  {
    id: "looping",
    label: "Small loop (high locality)",
    frames: 3,
    reference: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3]
  },
  {
    id: "sequential",
    label: "Sequential scan (low locality)",
    frames: 4,
    reference: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  {
    id: "thrash",
    label: "Thrashing demo",
    frames: 3,
    reference: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]
  }
];

export function referenceToString(reference) {
  return Array.isArray(reference) ? reference.join(" ") : "";
}

function clampInt(n, { min, max }) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

export function generateRandomReference({
  length = 20,
  maxPage = 9,
  locality = 0.6
} = {}) {
  const safeLength = clampInt(length, { min: 5, max: 200 });
  const safeMaxPage = clampInt(maxPage, { min: 2, max: 99 });
  const safeLocality = Math.max(0, Math.min(0.95, Number(locality) || 0));

  const out = [];
  for (let i = 0; i < safeLength; i += 1) {
    const prev = out[i - 1];
    const roll = Math.random();
    if (i > 0 && roll < safeLocality) out.push(prev);
    else out.push(Math.floor(Math.random() * (safeMaxPage + 1)));
  }
  return out;
}

