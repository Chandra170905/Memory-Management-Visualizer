export function parseReferenceString(input) {
  return parseReferenceStringDetailed(input).pages;
}

export function parseReferenceStringDetailed(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return { pages: [], invalidTokens: [] };

  const tokens = trimmed
    .split(/[,\s]+/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const pages = [];
  const invalidTokens = [];

  for (const t of tokens) {
    if (!/^\d+$/.test(t)) {
      invalidTokens.push(t);
      continue;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) {
      invalidTokens.push(t);
      continue;
    }
    pages.push(n);
  }

  return { pages, invalidTokens };
}
