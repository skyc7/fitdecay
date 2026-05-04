import type { FitDecayData } from "../types";

const now = new Date();
const isoDaysAgo = (days: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export const demoData: FitDecayData = {
  profile: {
    id: "demo-profile",
    name: "Alex",
    age: 28,
    sex: "other",
    trainingAge: 4,
    weight: 78,
    height: 178,
    unitSystem: "metric",
    createdAt: isoDaysAgo(120),
  },
  baselines: [
    { id: "b-squat", type: "strength", name: "Back Squat", value: 145, unit: "kg", recordedAt: isoDaysAgo(45), isCurrentPr: true, modality: "barbell", inputKind: "rep_max", reps: 5 },
    { id: "b-chest-press", type: "strength", name: "Chest Press Machine", value: 86, unit: "kg", recordedAt: isoDaysAgo(52), isCurrentPr: true, modality: "machine", inputKind: "rep_max", reps: 10, loadContext: "Pin-loaded machine, seat 4" },
    { id: "b-pulldown", type: "strength", name: "Lat Pulldown", value: 72, unit: "kg", recordedAt: isoDaysAgo(60), isCurrentPr: true, modality: "machine", inputKind: "rep_max", reps: 12 },
    { id: "b-pullups", type: "strength", name: "Pull-ups", value: 14, unit: "reps", recordedAt: isoDaysAgo(41), isCurrentPr: true, modality: "bodyweight", inputKind: "bodyweight_reps" },
    { id: "b-5k", type: "cardio", name: "5K Time", value: 1215, unit: "seconds", recordedAt: isoDaysAgo(38), isCurrentPr: true, modality: "cardio", inputKind: "time" },
    { id: "b-vertical", type: "sport", name: "Vertical Jump", value: 72, unit: "cm", recordedAt: isoDaysAgo(32), isCurrentPr: true, modality: "sport", inputKind: "height" },
    { id: "b-yoga", type: "mobility", name: "Crow Pose Hold", value: 28, unit: "seconds", recordedAt: isoDaysAgo(30), isCurrentPr: true, modality: "yoga", inputKind: "hold_time" },
    { id: "b-pilates", type: "mobility", name: "Side Plank Hold", value: 75, unit: "seconds", recordedAt: isoDaysAgo(28), isCurrentPr: true, modality: "pilates", inputKind: "hold_time" },
  ],
  layoffs: [
    {
      id: "l-illness",
      startDate: isoDaysAgo(36),
      endDate: isoDaysAgo(18),
      reason: "illness",
      reasonDetails: "Fever for the first few days, then low energy.",
      activityLevel: "light_activity",
    },
    {
      id: "l-finals",
      startDate: isoDaysAgo(9),
      endDate: null,
      reason: "busy",
      reasonDetails: "Finals week, only walking around campus.",
      activityLevel: "light_activity",
    },
  ],
  returnTests: [
    { id: "rt-squat", layoffId: "l-illness", baselineId: "b-squat", predictedValue: 141, actualValue: 143, testedAt: isoDaysAgo(16) },
    { id: "rt-5k", layoffId: "l-illness", baselineId: "b-5k", predictedValue: 1275, actualValue: 1292, testedAt: isoDaysAgo(15) },
    { id: "rt-vertical", layoffId: "l-illness", baselineId: "b-vertical", predictedValue: 68, actualValue: 69, testedAt: isoDaysAgo(14) },
    { id: "rt-yoga", layoffId: "l-illness", baselineId: "b-yoga", predictedValue: 26, actualValue: 27, testedAt: isoDaysAgo(14) },
  ],
  workoutLogs: [
    { id: "wl-1", layoffId: "l-illness", week: 1, label: "Easy squat re-entry", completedAt: isoDaysAgo(13), felt: 4, notes: "Warmups felt better than expected. Kept two reps in reserve." },
    { id: "wl-2", layoffId: "l-illness", week: 1, label: "Easy run", completedAt: isoDaysAgo(12), felt: 3, notes: "Breathing felt rusty for the first ten minutes." },
  ],
  weightLogs: [
    { id: "bw-1", date: isoDaysAgo(9), weight: 78.2, unit: "kg", layoffId: "l-finals" },
    { id: "bw-2", date: isoDaysAgo(5), weight: 78.9, unit: "kg", layoffId: "l-finals" },
    { id: "bw-3", date: isoDaysAgo(1), weight: 79.1, unit: "kg", layoffId: "l-finals" },
  ],
  settings: {
    theme: "dark",
    sound: false,
    showConfidenceBands: true,
    beginnerMode: true,
    visitCount: 2,
  },
};
