async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function simulate({ frames, reference, algorithm }) {
  return postJson("/api/simulate", { frames, reference, algorithm });
}

export async function compare({ frames, reference }) {
  return postJson("/api/compare", { frames, reference });
}

