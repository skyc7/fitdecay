import type { BaselineInputKind, QualityType, TrainingModality } from "../types";

export interface ExerciseOption {
  type: QualityType;
  name: string;
  unit: string;
  modality: TrainingModality;
  inputKind: BaselineInputKind;
  defaultReps?: number;
  examples?: string[];
}

export const exerciseOptions: ExerciseOption[] = [
  { type: "strength", name: "Back Squat", unit: "kg", modality: "barbell", inputKind: "rep_max", defaultReps: 5, examples: ["Back Squat 5RM", "Front Squat 3RM", "Box Squat 8RM"] },
  { type: "strength", name: "Bench Press", unit: "kg", modality: "barbell", inputKind: "rep_max", defaultReps: 5, examples: ["Bench Press 5RM", "Close-Grip Bench 8RM"] },
  { type: "strength", name: "Deadlift", unit: "kg", modality: "barbell", inputKind: "rep_max", defaultReps: 3, examples: ["Deadlift 3RM", "Romanian Deadlift 8RM"] },
  { type: "strength", name: "Overhead Press", unit: "kg", modality: "barbell", inputKind: "rep_max", defaultReps: 5 },
  { type: "strength", name: "Leg Press", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 10, examples: ["Leg Press 10RM", "Hack Squat 8RM", "Smith Squat 6RM"] },
  { type: "strength", name: "Chest Press Machine", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 10 },
  { type: "strength", name: "Lat Pulldown", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 10 },
  { type: "strength", name: "Seated Row", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 10 },
  { type: "strength", name: "Leg Extension", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 12 },
  { type: "strength", name: "Hamstring Curl", unit: "kg", modality: "machine", inputKind: "rep_max", defaultReps: 12 },
  { type: "strength", name: "Cable Row", unit: "kg", modality: "cable", inputKind: "rep_max", defaultReps: 10 },
  { type: "strength", name: "Dumbbell Bench Press", unit: "kg", modality: "dumbbell", inputKind: "rep_max", defaultReps: 8 },
  { type: "strength", name: "Pull-ups", unit: "reps", modality: "bodyweight", inputKind: "bodyweight_reps", defaultReps: 1, examples: ["Max pull-ups", "Push-ups in one set", "Dips in one set"] },
  { type: "strength", name: "Push-ups", unit: "reps", modality: "bodyweight", inputKind: "bodyweight_reps", defaultReps: 1 },
  { type: "strength", name: "Dips", unit: "reps", modality: "bodyweight", inputKind: "bodyweight_reps", defaultReps: 1 },
  { type: "cardio", name: "5K Time", unit: "seconds", modality: "cardio", inputKind: "time" },
  { type: "cardio", name: "Mile Time", unit: "seconds", modality: "cardio", inputKind: "time" },
  { type: "cardio", name: "10K Time", unit: "seconds", modality: "cardio", inputKind: "time" },
  { type: "cardio", name: "VO2 Max", unit: "ml/kg/min", modality: "cardio", inputKind: "score" },
  { type: "cardio", name: "2K Row", unit: "seconds", modality: "cardio", inputKind: "time" },
  { type: "cardio", name: "FTP", unit: "watts", modality: "cardio", inputKind: "score" },
  { type: "sport", name: "Vertical Jump", unit: "cm", modality: "sport", inputKind: "height" },
  { type: "sport", name: "Broad Jump", unit: "cm", modality: "sport", inputKind: "distance" },
  { type: "sport", name: "40-yard Dash", unit: "seconds", modality: "sport", inputKind: "time" },
  { type: "sport", name: "10m Sprint", unit: "seconds", modality: "sport", inputKind: "time" },
  { type: "sport", name: "Pro Agility Shuttle", unit: "seconds", modality: "sport", inputKind: "time" },
  { type: "mobility", name: "Sit-and-Reach", unit: "cm", modality: "mobility", inputKind: "range_of_motion", examples: ["Sit-and-Reach", "Shoulder flexion ROM", "Hip internal rotation"] },
  { type: "mobility", name: "Single-Leg Balance", unit: "seconds", modality: "mobility", inputKind: "hold_time" },
  { type: "mobility", name: "Yoga Flow Duration", unit: "minutes", modality: "yoga", inputKind: "time", examples: ["Vinyasa flow duration", "Crow pose hold", "Single-leg balance"] },
  { type: "mobility", name: "Crow Pose Hold", unit: "seconds", modality: "yoga", inputKind: "hold_time" },
  { type: "mobility", name: "Pilates Hundred", unit: "reps", modality: "pilates", inputKind: "bodyweight_reps", examples: ["Pilates Hundred reps", "Teaser hold", "Side plank hold"] },
  { type: "mobility", name: "Side Plank Hold", unit: "seconds", modality: "pilates", inputKind: "hold_time" },
];

export function optionsForType(type: QualityType) {
  return exerciseOptions.filter((option) => option.type === type);
}

export const modalityLabels: Record<TrainingModality, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  cable: "Cable",
  bodyweight: "Bodyweight / calisthenics",
  cardio: "Cardio",
  sport: "Sport test",
  yoga: "Yoga",
  pilates: "Pilates",
  mobility: "Mobility",
  custom: "Custom",
};
