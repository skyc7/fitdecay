import type { Baseline, DecayResult, QualityType, UnitSystem } from "../types";

export const KG_TO_LB = 2.2046226218;
const CM_TO_IN = 0.3937007874;
const KM_TO_MI = 0.6213711922;
const M_TO_YD = 1.0936132983;

export function roundTo(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}

export function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

export function floorNumber(value: number) {
  return Math.floor(value);
}

function normalizeUnit(unit: string) {
  return unit.trim().toLowerCase();
}

export function isTimeUnit(unit: string) {
  return /^(s|sec|secs|second|seconds|min|mins|minute|minutes)$/i.test(unit.trim());
}

export function isLengthUnit(unit: string) {
  const normalized = normalizeUnit(unit);
  return ["cm", "centimeter", "centimeters", "in", "inch", "inches", "m", "meter", "meters", "km", "kilometer", "kilometers", "mi", "mile", "miles", "yd", "yard", "yards"].includes(normalized);
}

export function formatDuration(value: number, unit: string) {
  const normalized = normalizeUnit(unit);
  const totalSeconds = floorNumber(normalized.startsWith("min") ? value * 60 : value);
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} min`;
}

export function formatBaselineValue(value: number, unit: string, unitSystem: UnitSystem = "metric") {
  return formatDisplayValue(value, unit, unitSystem).text;
}

export function isWeightUnit(unit: string) {
  const normalized = normalizeUnit(unit);
  return ["kg", "kgs", "kilogram", "kilograms", "lb", "lbs", "pound", "pounds"].includes(normalized);
}

export function displayUnit(unit: string, unitSystem: UnitSystem) {
  if (!isWeightUnit(unit)) return unit;
  return unitSystem === "metric" ? "kg" : "lbs";
}

export function convertWeightValue(value: number, fromUnit: string, toUnit: string) {
  const from = displayUnit(fromUnit, fromUnit.toLowerCase().startsWith("lb") ? "imperial" : "metric");
  const to = displayUnit(toUnit, toUnit.toLowerCase().startsWith("lb") ? "imperial" : "metric");
  if (from === to) return value;
  if (from === "kg" && to === "lbs") return value * KG_TO_LB;
  if (from === "lbs" && to === "kg") return value / KG_TO_LB;
  return value;
}

export function convertValueBetweenUnits(value: number, fromUnit: string, toUnit: string) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (from === to) return value;
  if (isWeightUnit(from) && isWeightUnit(to)) return convertWeightValue(value, from, to);
  if (["cm", "centimeter", "centimeters"].includes(from) && ["in", "inch", "inches"].includes(to)) return value * CM_TO_IN;
  if (["in", "inch", "inches"].includes(from) && ["cm", "centimeter", "centimeters"].includes(to)) return value / CM_TO_IN;
  if (["km", "kilometer", "kilometers"].includes(from) && ["mi", "mile", "miles"].includes(to)) return value * KM_TO_MI;
  if (["mi", "mile", "miles"].includes(from) && ["km", "kilometer", "kilometers"].includes(to)) return value / KM_TO_MI;
  if (["m", "meter", "meters"].includes(from) && ["yd", "yard", "yards"].includes(to)) return value * M_TO_YD;
  if (["yd", "yard", "yards"].includes(from) && ["m", "meter", "meters"].includes(to)) return value / M_TO_YD;
  return value;
}

export function valueForUnitSystem(value: number, unit: string, unitSystem: UnitSystem) {
  const normalized = normalizeUnit(unit);
  if (isTimeUnit(unit)) return value;
  if (isWeightUnit(unit)) {
    const current = normalized.startsWith("lb") || normalized.startsWith("pound") ? "imperial" : "metric";
    if ((unitSystem === "metric" && current === "metric") || (unitSystem !== "metric" && current === "imperial")) return value;
    return unitSystem === "metric" ? value / KG_TO_LB : value * KG_TO_LB;
  }
  if (["cm", "centimeter", "centimeters"].includes(normalized)) return unitSystem === "metric" ? value : value * CM_TO_IN;
  if (["in", "inch", "inches"].includes(normalized)) return unitSystem === "metric" ? value / CM_TO_IN : value;
  if (["km", "kilometer", "kilometers"].includes(normalized)) return unitSystem === "metric" ? value : value * KM_TO_MI;
  if (["mi", "mile", "miles"].includes(normalized)) return unitSystem === "metric" ? value / KM_TO_MI : value;
  if (["m", "meter", "meters"].includes(normalized)) return unitSystem === "metric" ? value : value * M_TO_YD;
  if (["yd", "yard", "yards"].includes(normalized)) return unitSystem === "metric" ? value / M_TO_YD : value;
  return value;
}

export function unitForUnitSystem(unit: string, unitSystem: UnitSystem) {
  const normalized = normalizeUnit(unit);
  if (isTimeUnit(unit)) return normalized.startsWith("min") ? "min" : "sec";
  if (isWeightUnit(unit)) return unitSystem === "metric" ? "kg" : "lbs";
  if (["cm", "centimeter", "centimeters", "in", "inch", "inches"].includes(normalized)) return unitSystem === "metric" ? "cm" : "in";
  if (["km", "kilometer", "kilometers", "mi", "mile", "miles"].includes(normalized)) return unitSystem === "metric" ? "km" : "mi";
  if (["m", "meter", "meters", "yd", "yard", "yards"].includes(normalized)) return unitSystem === "metric" ? "m" : "yd";
  return unit;
}

export function formatDisplayValue(value: number, unit: string, unitSystem: UnitSystem) {
  if (isTimeUnit(unit)) {
    return { value: floorNumber(value), unit: "sec", text: formatDuration(value, unit) };
  }
  const converted = floorNumber(valueForUnitSystem(value, unit, unitSystem));
  const display = unitForUnitSystem(unit, unitSystem);
  return { value: converted, unit: display, text: `${formatNumber(converted, 0)} ${display}` };
}

export function formatDisplayNumber(value: number, unit: string, unitSystem: UnitSystem) {
  return formatDisplayValue(value, unit, unitSystem).text;
}

export function parseDisplayInput(input: string, storedUnit: string, unitSystem: UnitSystem) {
  const trimmed = input.trim().toLowerCase().replace(/,/g, "");
  if (isTimeUnit(storedUnit) && trimmed.includes(":")) {
    const [minutes, seconds = "0"] = trimmed.split(":");
    const total = Number(minutes) * 60 + Number(seconds.replace(/[^\d.]/g, ""));
    return Number.isFinite(total) ? total : NaN;
  }
  const numeric = Number(trimmed.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return NaN;
  if (isTimeUnit(storedUnit)) return numeric;
  return convertValueBetweenUnits(numeric, unitForUnitSystem(storedUnit, unitSystem), storedUnit);
}

export function statusColor(percentLost: number) {
  if (percentLost < 6) return "text-emerald-300";
  if (percentLost < 15) return "text-amber-300";
  return "text-rose-300";
}

export function typeAccent(type: QualityType) {
  if (type === "strength") return "from-orange-400/20 to-amber-300/10 text-orange-200 border-orange-300/20";
  if (type === "cardio") return "from-sky-400/20 to-cyan-300/10 text-sky-200 border-sky-300/20";
  if (type === "sport") return "from-lime-400/20 to-emerald-300/10 text-lime-200 border-lime-300/20";
  return "from-fuchsia-400/20 to-violet-300/10 text-fuchsia-200 border-fuchsia-300/20";
}

export function summarizeDecay(baseline: Baseline, result: DecayResult) {
  const direction = (baseline.type === "cardio" || baseline.type === "sport") && /time|5k|mile|dash|sprint/i.test(baseline.name) ? "slower" : "down";
  return `${formatNumber(result.percentLost, 0)}% ${direction}`;
}
