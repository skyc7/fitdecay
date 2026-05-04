export type QualityType = "strength" | "cardio" | "sport" | "mobility";
export type UnitSystem = "metric" | "imperial" | "us";
export type TrainingModality = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "cardio" | "sport" | "yoga" | "pilates" | "mobility" | "custom";
export type BaselineInputKind = "max_load" | "rep_max" | "bodyweight_reps" | "time" | "distance" | "height" | "score" | "hold_time" | "range_of_motion";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  trainingAge: number;
  weight: number;
  height: number;
  unitSystem: UnitSystem;
  createdAt: string;
}

export interface Baseline {
  id: string;
  type: QualityType;
  name: string;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
  isCurrentPr?: boolean;
  modality?: TrainingModality;
  inputKind?: BaselineInputKind;
  reps?: number;
  loadContext?: string;
}

export interface Layoff {
  id: string;
  startDate: string;
  endDate: string | null;
  reason: "illness" | "injury" | "busy" | "vacation" | "other";
  reasonDetails?: string;
  activityLevel: "complete_rest" | "light_activity" | "reduced_training";
  affectedTypes?: QualityType[];
  affectedBaselineIds?: string[];
  difficultyMultiplier?: number;
  returnTestPromptDismissed?: boolean;
}

export interface ReturnTest {
  id: string;
  layoffId: string;
  baselineId: string;
  predictedValue: number;
  actualValue: number;
  testedAt: string;
}

export interface WorkoutLog {
  id: string;
  layoffId: string;
  week: number;
  label: string;
  completedAt: string;
  felt: number;
  notes?: string;
}

export interface DecayResult {
  predicted: number;
  confidence: number;
  percentLost: number;
}

export interface WeeklyPlanItem {
  day: string;
  title: string;
  target: string;
  notes: string;
}

export interface WeeklyPlan {
  type: QualityType;
  baselineName?: string;
  difficultyMultiplier?: number;
  weeks: Array<{
    week: number;
    focus: string;
    items: WeeklyPlanItem[];
  }>;
  warning?: string;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  unit?: string;
  layoffId?: string;
}

export interface UserSettings {
  theme: "system" | "dark" | "light";
  sound: boolean;
  showConfidenceBands: boolean;
  beginnerMode: boolean;
  dismissedInstallPromptUntil?: string;
  visitCount: number;
}

export interface FitDecayData {
  profile: UserProfile | null;
  baselines: Baseline[];
  layoffs: Layoff[];
  returnTests: ReturnTest[];
  workoutLogs: WorkoutLog[];
  weightLogs: WeightLog[];
  settings: UserSettings;
}

export interface Activity {
  id: string;
  date: string;
  label: string;
  detail: string;
}
