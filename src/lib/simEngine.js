function cloneFrames(frames) {
  return frames.slice();
}

function makeStep({ index, page, frames, fault, replacedIndex = null, evicted = null }) {
  return {
    index,
    page,
    frames: cloneFrames(frames),
    fault,
    replacedIndex,
    evicted
  };
}

function contains(frames, page) {
  return frames.indexOf(page);
}

function firstEmpty(frames) {
  return frames.indexOf(-1);
}

function faultsOnly(steps) {
  return steps.reduce((total, step) => total + (step.fault ? 1 : 0), 0);
}

function buildSimulateResponse(algorithm, frames, reference, steps) {
  const faults = faultsOnly(steps);
  const hits = steps.length - faults;

  return {
    ok: true,
    algorithm,
    frames,
    reference,
    summary: { faults, hits },
    steps
  };
}

function simulateFIFO(frameCount, reference) {
  const frames = Array.from({ length: frameCount }, () => -1);
  const order = [];
  const steps = [];

  for (let index = 0; index < reference.length; index += 1) {
    const page = reference[index];
    const hitIndex = contains(frames, page);

    if (hitIndex !== -1) {
      steps.push(makeStep({ index, page, frames, fault: false }));
      continue;
    }

    const emptyAt = firstEmpty(frames);
    if (emptyAt !== -1) {
      frames[emptyAt] = page;
      order.push(emptyAt);
      steps.push(
        makeStep({
          index,
          page,
          frames,
          fault: true,
          replacedIndex: emptyAt
        })
      );
      continue;
    }

    const victimFrame = order.shift();
    const evicted = frames[victimFrame];
    frames[victimFrame] = page;
    order.push(victimFrame);
    steps.push(
      makeStep({
        index,
        page,
        frames,
        fault: true,
        replacedIndex: victimFrame,
        evicted
      })
    );
  }

  return steps;
}

function simulateLRU(frameCount, reference) {
  const frames = Array.from({ length: frameCount }, () => -1);
  const lastUsed = Array.from({ length: frameCount }, () => -1);
  const steps = [];

  for (let index = 0; index < reference.length; index += 1) {
    const page = reference[index];
    const hitIndex = contains(frames, page);

    if (hitIndex !== -1) {
      lastUsed[hitIndex] = index;
      steps.push(makeStep({ index, page, frames, fault: false }));
      continue;
    }

    let victim = firstEmpty(frames);
    let evicted = null;

    if (victim === -1) {
      victim = 0;
      for (let i = 1; i < frameCount; i += 1) {
        if (lastUsed[i] < lastUsed[victim]) victim = i;
      }
      evicted = frames[victim];
    }

    frames[victim] = page;
    lastUsed[victim] = index;

    steps.push(
      makeStep({
        index,
        page,
        frames,
        fault: true,
        replacedIndex: victim,
        evicted
      })
    );
  }

  return steps;
}

function nextUseIndex(reference, start, page) {
  for (let index = start; index < reference.length; index += 1) {
    if (reference[index] === page) return index;
  }
  return -1;
}

function simulateOptimal(frameCount, reference) {
  const frames = Array.from({ length: frameCount }, () => -1);
  const steps = [];

  for (let index = 0; index < reference.length; index += 1) {
    const page = reference[index];
    const hitIndex = contains(frames, page);

    if (hitIndex !== -1) {
      steps.push(makeStep({ index, page, frames, fault: false }));
      continue;
    }

    let victim = firstEmpty(frames);
    let evicted = null;

    if (victim === -1) {
      let bestIndex = 0;
      let bestNextUse = -1;

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        const nextUse = nextUseIndex(reference, index + 1, frames[frameIndex]);
        if (nextUse === -1) {
          bestIndex = frameIndex;
          bestNextUse = Number.POSITIVE_INFINITY;
          break;
        }
        if (nextUse > bestNextUse) {
          bestNextUse = nextUse;
          bestIndex = frameIndex;
        }
      }

      victim = bestIndex;
      evicted = frames[victim];
    }

    frames[victim] = page;
    steps.push(
      makeStep({
        index,
        page,
        frames,
        fault: true,
        replacedIndex: victim,
        evicted
      })
    );
  }

  return steps;
}

function validateInput(frames, reference, algorithm = null) {
  const safeFrames = Number(frames);
  if (!Number.isInteger(safeFrames) || safeFrames < 1 || safeFrames > 12) {
    throw new Error("Invalid frames (expected integer 1..12).");
  }

  if (
    !Array.isArray(reference) ||
    !reference.length ||
    !reference.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    throw new Error("Invalid reference (expected array of numbers).");
  }

  if (algorithm && !["fifo", "lru", "optimal"].includes(algorithm)) {
    throw new Error("Invalid algorithm (fifo|lru|optimal).");
  }

  return safeFrames;
}

export function simulateLocal({ frames, reference, algorithm }) {
  const safeFrames = validateInput(frames, reference, algorithm);
  const algo = String(algorithm).toLowerCase();

  const steps =
    algo === "fifo"
      ? simulateFIFO(safeFrames, reference)
      : algo === "lru"
        ? simulateLRU(safeFrames, reference)
        : simulateOptimal(safeFrames, reference);

  return buildSimulateResponse(algo, safeFrames, reference, steps);
}

export function compareLocal({ frames, reference }) {
  const safeFrames = validateInput(frames, reference);
  const fifo = simulateFIFO(safeFrames, reference);
  const lru = simulateLRU(safeFrames, reference);
  const optimal = simulateOptimal(safeFrames, reference);

  return {
    ok: true,
    frames: safeFrames,
    reference,
    fifo: faultsOnly(fifo),
    lru: faultsOnly(lru),
    optimal: faultsOnly(optimal)
  };
}
