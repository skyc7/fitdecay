import type { FitDecayData } from "../types";

const STORAGE_KEY = "fitdecay:v1";

export interface FitDecayRepository {
  load(): FitDecayData;
  save(data: FitDecayData): void;
  clear(): void;
}

export const emptyData: FitDecayData = {
  profile: null,
  baselines: [],
  layoffs: [],
  returnTests: [],
  workoutLogs: [],
  weightLogs: [],
  settings: {
    theme: "dark",
    sound: false,
    showConfidenceBands: true,
    beginnerMode: true,
    visitCount: 0,
  },
};

export const localStorageRepository: FitDecayRepository = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    try {
      const parsed = { ...emptyData, ...JSON.parse(raw) } as FitDecayData;
      parsed.baselines = parsed.baselines ?? [];
      parsed.layoffs = (parsed.layoffs ?? []).map((layoff) => ({
        ...layoff,
        difficultyMultiplier: layoff.difficultyMultiplier ?? 1,
      }));
      parsed.returnTests = parsed.returnTests ?? [];
      parsed.workoutLogs = parsed.workoutLogs ?? [];
      parsed.weightLogs = (parsed.weightLogs ?? []).map((log) => ({
        ...log,
        unit: log.unit ?? (parsed.profile?.unitSystem === "metric" ? "kg" : "lbs"),
      }));
      parsed.settings = {
        ...emptyData.settings,
        ...(parsed.settings ?? {}),
        visitCount: (parsed.settings?.visitCount ?? 0) + 1,
      };
      if (parsed.profile && !parsed.profile.height) {
        parsed.profile = {
          ...parsed.profile,
          height: parsed.profile.unitSystem === "metric" ? 178 : 70,
        };
      }
      return parsed;
    } catch {
      return emptyData;
    }
  },
  save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export function exportJson(data: FitDecayData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fitdecay-export.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
