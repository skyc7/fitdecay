import type { Baseline, QualityType, ReturnTest } from "../types";

function isTimeMetric(baseline: Baseline) {
  return /second|minute|sec|min/i.test(baseline.unit) || /5k|mile|time|dash|sprint/i.test(baseline.name);
}

export function personalMultiplierForType(type: QualityType, baselines: Baseline[], returnTests: ReturnTest[]) {
  const relevant = returnTests
    .map((test) => ({ test, baseline: baselines.find((baseline) => baseline.id === test.baselineId) }))
    .filter((entry): entry is { test: ReturnTest; baseline: Baseline } => Boolean(entry.baseline && entry.baseline.type === type))
    .sort((a, b) => new Date(a.test.testedAt).getTime() - new Date(b.test.testedAt).getTime());

  if (relevant.length === 0) return 1;

  let weighted = 0;
  let total = 0;
  relevant.forEach(({ test, baseline }, index) => {
    const original = baseline.value;
    const predictedLoss = isTimeMetric(baseline)
      ? Math.max(0, (test.predictedValue - original) / original)
      : Math.max(0, (original - test.predictedValue) / original);
    const actualLoss = isTimeMetric(baseline)
      ? Math.max(0, (test.actualValue - original) / original)
      : Math.max(0, (original - test.actualValue) / original);
    if (predictedLoss < 0.002) return;
    const ratio = Math.min(1.45, Math.max(0.55, actualLoss / predictedLoss));
    const weight = index + 1;
    weighted += ratio * weight;
    total += weight;
  });

  return total ? weighted / total : 1;
}
