import { compareLocal, simulateLocal } from "./simEngine.js";

async function tryFetchJson(path, body) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(await response.text().catch(() => ""));
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function getEngineStatus() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("health-unavailable");
    const data = await response.json();
    return {
      mode: data?.binaryExists ? "local-cpp" : "local-api",
      ok: true,
      binaryExists: !!data?.binaryExists
    };
  } catch {
    return {
      mode: "browser-fallback",
      ok: true,
      binaryExists: false
    };
  }
}

export async function simulate({ frames, reference, algorithm }) {
  const remote = await tryFetchJson("/api/simulate", { frames, reference, algorithm });
  return remote ?? simulateLocal({ frames, reference, algorithm });
}

export async function compare({ frames, reference }) {
  const remote = await tryFetchJson("/api/compare", { frames, reference });
  return remote ?? compareLocal({ frames, reference });
}
