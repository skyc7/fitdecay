import type { Layoff, QualityType, ReturnTest, UserProfile } from "../types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function modifierForProfile(profile: UserProfile, layoff: Layoff, type: QualityType) {
  let modifier = 1;

  if (profile.trainingAge >= 5) modifier *= 0.8;
  if (profile.age > 35) modifier *= 1 + Math.floor((profile.age - 35) / 10 + 1) * 0.15;

  if (layoff.activityLevel === "light_activity") modifier *= type === "cardio" ? 0.65 : 0.8;
  if (layoff.activityLevel === "reduced_training") modifier *= type === "cardio" ? 0.35 : 0.4;

  if (layoff.reason === "illness") modifier *= type === "cardio" ? 1.25 : 1.15;
  if (layoff.reason === "injury") modifier *= 1.08;

  return clamp(modifier, 0.25, 1.85);
}

export function strengthLossPercent(daysOff: number, profile: UserProfile, layoff: Layoff, personalMultiplier = 1) {
  const weeks = daysOff / 7;
  let loss = 0;

  // Maximal strength is preserved longer than aerobic capacity due to retained neural adaptations.
  if (weeks <= 2) loss = 0;
  else if (weeks <= 4) loss = (weeks - 2) * 5;
  else if (weeks <= 8) loss = 10 + (weeks - 4) * 7;
  else loss = 25 + (1 - Math.exp(-(weeks - 8) / 8)) * 10;

  return clamp(loss * modifierForProfile(profile, layoff, "strength") * personalMultiplier, 0, 38);
}

export function cardioLossPercent(daysOff: number, profile: UserProfile, layoff: Layoff, personalMultiplier = 1) {
  const weeks = daysOff / 7;
  let loss = 0;

  // Aerobic capacity detrains quickly because plasma volume, stroke volume, and oxidative enzymes decline early.
  if (weeks <= 2) loss = weeks * 3.25;
  else if (weeks <= 4) loss = 6.5 + (weeks - 2) * 4;
  else if (weeks <= 8) loss = 14.5 + (weeks - 4) * 1.3;
  else loss = 19.7 + (1 - Math.exp(-(weeks - 8) / 4)) * 6;

  return clamp(loss * modifierForProfile(profile, layoff, "cardio") * personalMultiplier, 0, 30);
}

export function sportLossPercent(daysOff: number, profile: UserProfile, layoff: Layoff, personalMultiplier = 1) {
  const weeks = daysOff / 7;
  let loss = 0;

  // Power qualities lose output sooner than maximal strength but slower than endurance; skill components fade more slowly.
  if (weeks <= 1) loss = weeks * 2.5;
  else if (weeks <= 4) loss = 2.5 + (weeks - 1) * 2.1;
  else loss = 8.8 + (1 - Math.exp(-(weeks - 4) / 5)) * 10;

  return clamp(loss * modifierForProfile(profile, layoff, "sport") * personalMultiplier, 0, 22);
}

export function mobilityLossPercent(daysOff: number, profile: UserProfile, layoff: Layoff, personalMultiplier = 1) {
  const weeks = daysOff / 7;
  let loss = 0;

  // Flexibility, balance, and motor-control qualities are partly skill based, so short layoffs usually reduce tolerance and confidence before erasing the adaptation.
  if (weeks <= 2) loss = weeks * 1.5;
  else if (weeks <= 6) loss = 3 + (weeks - 2) * 2;
  else loss = 11 + (1 - Math.exp(-(weeks - 6) / 6)) * 8;

  return clamp(loss * modifierForProfile(profile, layoff, "mobility") * personalMultiplier, 0, 24);
}

export function calculatePersonalMultiplier(returnTests: ReturnTest[]) {
  if (returnTests.length === 0) return 1;
  const sorted = [...returnTests].sort((a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime());
  let weighted = 0;
  let totalWeight = 0;

  sorted.forEach((test, index) => {
    const predictedLoss = Math.abs(test.predictedValue - test.actualValue);
    const modelLoss = Math.max(Math.abs(test.predictedValue) * 0.01, predictedLoss);
    const ratio = clamp(predictedLoss / modelLoss, 0.45, 1.55);
    const weight = index + 1;
    weighted += ratio * weight;
    totalWeight += weight;
  });

  return clamp(weighted / totalWeight, 0.55, 1.45);
}
