export const ALGORITHM_META = {
  fifo: {
    label: "FIFO",
    shortLabel: "Queue rotation",
    description: "Evicts the page that has been in memory the longest."
  },
  lru: {
    label: "LRU",
    shortLabel: "Recency aware",
    description: "Evicts the page that was used least recently."
  },
  optimal: {
    label: "Optimal",
    shortLabel: "Theoretical best",
    description: "Evicts the page needed farthest in the future."
  }
};

function clampPercent(value) {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return 0;
  return Math.max(0, Math.min(100, Math.round(safe)));
}

export function formatPercent(value) {
  return `${clampPercent(value)}%`;
}

export function analyzeReference(reference, frames) {
  const safeReference = Array.isArray(reference)
    ? reference.filter((value) => Number.isFinite(value))
    : [];
  const safeFrames = Math.max(1, Number(frames) || 1);

  if (!safeReference.length) {
    return {
      uniquePages: 0,
      localityScore: 0,
      reuseRate: 0,
      scanScore: 0,
      pressureScore: 0,
      profileTitle: "Awaiting workload",
      profileSummary:
        "Add a reference string to generate an adaptive behavior profile for the lesson.",
      missionObjective:
        "Use the generator or load a mission preset to begin the simulation.",
      classroomPrompt:
        "Ask learners to predict which pages will stay resident before pressing Run.",
      recommendedAlgorithm: "fifo",
      challengeLevel: "Intro",
      pressureLabel: "Idle",
      localityLabel: "Unknown"
    };
  }

  const uniquePages = new Set(safeReference).size;
  let seenRepeats = 0;
  let nearbyReuses = 0;
  let immediateRepeats = 0;
  let sequentialMoves = 0;
  const seen = new Set();

  for (let index = 0; index < safeReference.length; index += 1) {
    const page = safeReference[index];
    const previous = safeReference[index - 1];

    if (seen.has(page)) seenRepeats += 1;
    if (page === previous) immediateRepeats += 1;
    if (Number.isFinite(previous) && Math.abs(page - previous) === 1) {
      sequentialMoves += 1;
    }

    const windowStart = Math.max(0, index - 3);
    const recentWindow = safeReference.slice(windowStart, index);
    if (recentWindow.includes(page)) nearbyReuses += 1;

    seen.add(page);
  }

  const reuseRate = clampPercent((seenRepeats / safeReference.length) * 100);
  const localityScore = clampPercent(
    ((nearbyReuses + immediateRepeats) / Math.max(1, safeReference.length - 1)) *
      100
  );
  const scanScore = clampPercent(
    (sequentialMoves / Math.max(1, safeReference.length - 1)) * 100
  );
  const pressureScore = clampPercent(
    (uniquePages / safeFrames) * 18 + (100 - localityScore) * 0.35 + scanScore * 0.25
  );

  let profileTitle = "Mixed interactive workload";
  let profileSummary =
    "The trace alternates between revisits and fresh requests, which is ideal for demonstrating why replacement policy matters.";
  let missionObjective =
    "Step through the sequence and notice when recent reuse protects pages from eviction.";
  let classroomPrompt =
    "Pause before each fault and ask learners which resident page is most vulnerable.";
  let recommendedAlgorithm = "lru";

  if (localityScore >= 72) {
    profileTitle = "Loop-heavy locality pattern";
    profileSummary =
      "Requests cluster around the same working set, so recent history strongly predicts what should remain in memory.";
    missionObjective =
      "Watch how hits increase once the active working set settles into the available frames.";
    classroomPrompt =
      "Challenge students to spot the moment when the working set fits and faults begin to slow down.";
    recommendedAlgorithm = "lru";
  } else if (scanScore >= 55) {
    profileTitle = "Sequential scan pressure";
    profileSummary =
      "The workload streams through new pages in order, creating a clear demonstration of memory pressure and limited reuse.";
    missionObjective =
      "Observe how a scan can keep pushing useful pages out even when the pattern feels predictable.";
    classroomPrompt =
      "Ask why future knowledge helps Optimal more than FIFO or LRU in a scan-heavy trace.";
    recommendedAlgorithm = "optimal";
  } else if (pressureScore >= 78) {
    profileTitle = "Thrashing risk detected";
    profileSummary =
      "The working set is competing for too few frames, so the simulator is likely to show repeated faults and frequent replacement.";
    missionObjective =
      "Use the playback controls to identify bursts of instability and compare how each policy responds.";
    classroomPrompt =
      "Have learners predict whether adding one more frame will reduce faults or barely change the outcome.";
    recommendedAlgorithm = "lru";
  }

  const challengeLevel =
    pressureScore >= 80 ? "Advanced" : pressureScore >= 55 ? "Intermediate" : "Intro";
  const pressureLabel =
    pressureScore >= 80 ? "Critical" : pressureScore >= 60 ? "Elevated" : "Stable";
  const localityLabel =
    localityScore >= 75
      ? "High locality"
      : localityScore >= 45
        ? "Moderate locality"
        : "Low locality";

  return {
    uniquePages,
    localityScore,
    reuseRate,
    scanScore,
    pressureScore,
    profileTitle,
    profileSummary,
    missionObjective,
    classroomPrompt,
    recommendedAlgorithm,
    challengeLevel,
    pressureLabel,
    localityLabel
  };
}

export function getAlgorithmCoach(algo, analysis) {
  const id = String(algo || "fifo").toLowerCase();

  if (id === "fifo") {
    return {
      title: "Queue discipline focus",
      note:
        analysis.localityScore >= 60
          ? "FIFO is easy to explain, but this workload may expose how old pages can still be useful when locality is strong."
          : "FIFO gives learners a clear first model because age, not behavior, drives the replacement decision."
    };
  }

  if (id === "lru") {
    return {
      title: "Recency focus",
      note:
        analysis.localityScore >= 60
          ? "LRU should feel intuitive here because pages used recently are more likely to be useful again soon."
          : "LRU still tracks recency, but this workload may reveal that recent access is not always enough under heavy pressure."
    };
  }

  return {
    title: "Benchmark focus",
    note:
      "Optimal is the upper benchmark for discussion. Use it to show the minimum possible faults and measure how far practical strategies are from that lower bound."
  };
}

export function getSimulationTelemetry(steps, stepIndex) {
  const safeSteps = Array.isArray(steps) ? steps : [];

  if (!safeSteps.length) {
    return {
      observedCount: 0,
      observedHits: 0,
      observedFaults: 0,
      progressPercent: 0,
      hitRate: 0,
      faultRate: 0,
      missionScore: 0,
      hitStreak: 0,
      faultStreak: 0
    };
  }

  const cappedIndex = Math.max(0, Math.min(stepIndex, safeSteps.length - 1));
  const observed = safeSteps.slice(0, cappedIndex + 1);
  let observedHits = 0;
  let observedFaults = 0;

  for (const step of observed) {
    if (step?.fault) observedFaults += 1;
    else observedHits += 1;
  }

  let hitStreak = 0;
  for (let index = observed.length - 1; index >= 0; index -= 1) {
    if (observed[index]?.fault) break;
    hitStreak += 1;
  }

  let faultStreak = 0;
  for (let index = observed.length - 1; index >= 0; index -= 1) {
    if (!observed[index]?.fault) break;
    faultStreak += 1;
  }

  const hitRate = clampPercent((observedHits / observed.length) * 100);
  const faultRate = clampPercent((observedFaults / observed.length) * 100);
  const progressPercent = clampPercent((observed.length / safeSteps.length) * 100);
  const missionScore = clampPercent(hitRate * 0.7 + (100 - faultRate) * 0.3);

  return {
    observedCount: observed.length,
    observedHits,
    observedFaults,
    progressPercent,
    hitRate,
    faultRate,
    missionScore,
    hitStreak,
    faultStreak
  };
}

export function describeStep({ current, algo }) {
  const id = String(algo || "fifo").toLowerCase();
  const algorithmLabel = ALGORITHM_META[id]?.label || "FIFO";

  if (!current) {
    return {
      title: "Simulation ready",
      body:
        "Press Run to open the live mission log. Each request will explain why the selected algorithm kept or replaced a page.",
      takeaway:
        "Good teaching flow: predict the next resident set before revealing the result."
    };
  }

  if (!current.fault) {
    return {
      title: "Resident page reused",
      body: `Page ${current.page} was already loaded, so ${algorithmLabel} preserved the current resident set and avoided a fault.`,
      takeaway:
        "Hits are the moment to reinforce locality: useful pages stay valuable when requests revisit a stable working set."
    };
  }

  if (current.evicted === null) {
    return {
      title: "Warm-up load",
      body: `Page ${current.page} entered frame ${current.replacedIndex + 1} while free capacity still existed, so no eviction was needed.`,
      takeaway:
        "Early steps often teach the difference between filling empty memory and replacing an established resident set."
    };
  }

  if (id === "fifo") {
    return {
      title: "Oldest page rotated out",
      body: `FIFO replaced page ${current.evicted} in frame ${current.replacedIndex + 1} because it had waited in memory the longest.`,
      takeaway:
        "This is a useful discussion point: age alone does not guarantee that a page is no longer important."
    };
  }

  if (id === "lru") {
    return {
      title: "Least-recently-used page evicted",
      body: `LRU removed page ${current.evicted} from frame ${current.replacedIndex + 1} because it had gone unused longer than the other resident pages.`,
      takeaway:
        "Recency is a behavior-driven heuristic, so this step helps learners connect access history to eviction choices."
    };
  }

  return {
    title: "Farthest-future page evicted",
    body: `Optimal removed page ${current.evicted} from frame ${current.replacedIndex + 1} because it is needed later than the other choices in the remaining trace.`,
    takeaway:
      "Use this benchmark to ask how close a practical strategy can get without future knowledge."
  };
}

export function buildNextCue(steps, stepIndex) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const next = safeSteps[stepIndex + 1];

  if (!next) {
    return "Mission complete. Switch the algorithm, adjust frames, or generate a new workload to continue the lesson.";
  }

  if (next.fault) {
    return `Next request: page ${next.page}. Expect a fault and watch frame ${next.replacedIndex + 1} for the replacement.`;
  }

  return `Next request: page ${next.page}. It should land as a hit if the resident set remains stable.`;
}

export function rankAlgorithms(data, referenceLength) {
  if (!data) return [];

  const source = [
    { id: "fifo", label: "FIFO", faults: Number(data.fifo) || 0, accent: "sky" },
    { id: "lru", label: "LRU", faults: Number(data.lru) || 0, accent: "teal" },
    { id: "optimal", label: "Optimal", faults: Number(data.optimal) || 0, accent: "amber" }
  ];

  const sorted = [...source].sort((left, right) => {
    if (left.faults !== right.faults) return left.faults - right.faults;
    return left.label.localeCompare(right.label);
  });

  return sorted.map((entry, index) => {
    const lead = entry.faults - sorted[0].faults;
    const efficiency = referenceLength
      ? clampPercent((1 - entry.faults / referenceLength) * 100)
      : 0;

    let note = "Competitive on this workload.";
    if (index === 0) note = "Best fault performance for this workload.";
    else if (lead === 0) note = "Tied with the current leader.";
    else note = `${lead} extra fault${lead === 1 ? "" : "s"} compared with the leader.`;

    return {
      ...entry,
      rank: index + 1,
      lead,
      efficiency,
      note
    };
  });
}

export function buildComparisonTakeaway(ranking, analysis) {
  if (!ranking.length) {
    return "Run the arena to compare how each strategy responds to the same workload profile.";
  }

  const winner = ranking[0];
  const recommendedLabel =
    ALGORITHM_META[analysis.recommendedAlgorithm]?.label || "LRU";

  if (winner.id === analysis.recommendedAlgorithm) {
    return `${winner.label} matches the workload profile. This is a good moment to connect the observed result back to the behavioral signals in the trace.`;
  }

  return `${winner.label} won this round even though the behavior profile initially pointed toward ${recommendedLabel}. That mismatch is a strong teaching prompt about why heuristics and real traces can diverge.`;
}
