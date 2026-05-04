import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { demoData } from "../data/demoData";
import type { Baseline, FitDecayData, Layoff, ReturnTest, UserProfile, UserSettings, WeightLog, WorkoutLog } from "../types";
import { emptyData, localStorageRepository } from "./storage";

interface DataContextValue {
  data: FitDecayData;
  setProfile(profile: UserProfile): void;
  addBaseline(baseline: Baseline): void;
  updateBaseline(baseline: Baseline): void;
  deleteBaseline(id: string): void;
  addLayoff(layoff: Layoff): void;
  updateLayoff(layoff: Layoff): void;
  addReturnTest(test: ReturnTest): void;
  addReturnTests(tests: ReturnTest[]): void;
  addWorkoutLog(log: WorkoutLog): void;
  updateWorkoutLog(log: WorkoutLog): void;
  addWeightLog(log: WeightLog): void;
  updateWeightLogs(logs: WeightLog[]): void;
  updateSettings(settings: Partial<UserSettings>): void;
  loadDemo(): void;
  reset(): void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FitDecayData>(() => localStorageRepository.load());

  useEffect(() => {
    localStorageRepository.save(data);
  }, [data]);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      setProfile: (profile) => setData((current) => ({ ...current, profile })),
      addBaseline: (baseline) => setData((current) => ({ ...current, baselines: [baseline, ...current.baselines] })),
      updateBaseline: (baseline) =>
        setData((current) => ({ ...current, baselines: current.baselines.map((item) => (item.id === baseline.id ? baseline : item)) })),
      deleteBaseline: (id) => setData((current) => ({ ...current, baselines: current.baselines.filter((item) => item.id !== id) })),
      addLayoff: (layoff) => setData((current) => ({ ...current, layoffs: [layoff, ...current.layoffs] })),
      updateLayoff: (layoff) => setData((current) => ({ ...current, layoffs: current.layoffs.map((item) => (item.id === layoff.id ? layoff : item)) })),
      addReturnTest: (test) => setData((current) => ({ ...current, returnTests: [test, ...current.returnTests] })),
      addReturnTests: (tests) => setData((current) => ({ ...current, returnTests: [...tests, ...current.returnTests] })),
      addWorkoutLog: (log) => setData((current) => ({ ...current, workoutLogs: [log, ...current.workoutLogs] })),
      updateWorkoutLog: (log) =>
        setData((current) => ({ ...current, workoutLogs: current.workoutLogs.map((item) => (item.id === log.id ? log : item)) })),
      addWeightLog: (log) => setData((current) => ({ ...current, weightLogs: [log, ...current.weightLogs] })),
      updateWeightLogs: (logs) => setData((current) => ({ ...current, weightLogs: logs })),
      updateSettings: (settings) => setData((current) => ({ ...current, settings: { ...current.settings, ...settings } })),
      loadDemo: () => setData(demoData),
      reset: () => setData(emptyData),
    }),
    [data],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useFitDecay() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useFitDecay must be used inside DataProvider");
  return context;
}
