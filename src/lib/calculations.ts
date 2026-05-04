import type { Baseline, DecayResult, Layoff, ReturnTest, UserProfile, WeeklyPlan } from "../types";
import { formatDisplayValue, formatDuration } from "./format";
import { calculatePersonalMultiplier as modelPersonalMultiplier, cardioLossPercent, mobilityLossPercent, sportLossPercent, strengthLossPercent } from "./decayModels";

function isTimeMetric(unit: string, name = "") {
  return /second|minute|sec|min/i.test(unit) || /5k|mile|time|dash|sprint/i.test(name);
}

function resultFromLoss(originalValue: number, percentLost: number, higherIsWorse = false): DecayResult {
  const direction = higherIsWorse ? 1 + percentLost / 100 : 1 - percentLost / 100;
  return {
    predicted: Math.max(0, originalValue * direction),
    confidence: Math.max(2, Math.min(12, 4 + percentLost * 0.28)),
    percentLost,
  };
}

export function isBaselineAffected(baseline: Baseline, layoff: Layoff) {
  if (layoff.affectedBaselineIds?.length) return layoff.affectedBaselineIds.includes(baseline.id);
  if (layoff.affectedTypes?.length) return layoff.affectedTypes.includes(baseline.type);
  return true;
}

export function calculateStrengthDecay(
  originalValue: number,
  daysOff: number,
  profile: UserProfile,
  layoff: Layoff,
  personalMultiplier = 1,
) {
  return resultFromLoss(originalValue, strengthLossPercent(daysOff, profile, layoff, personalMultiplier));
}

export function calculateCardioDecay(
  originalValue: number,
  originalUnit: string,
  daysOff: number,
  profile: UserProfile,
  layoff: Layoff,
  personalMultiplier = 1,
  name = "",
) {
  const vo2Loss = cardioLossPercent(daysOff, profile, layoff, personalMultiplier);
  const performanceLoss = isTimeMetric(originalUnit, name) ? vo2Loss * 0.62 : vo2Loss;
  return resultFromLoss(originalValue, performanceLoss, isTimeMetric(originalUnit, name));
}

export function calculateSportDecay(
  originalValue: number,
  daysOff: number,
  profile: UserProfile,
  layoff: Layoff,
  personalMultiplier = 1,
  baseline?: Baseline,
) {
  return resultFromLoss(originalValue, sportLossPercent(daysOff, profile, layoff, personalMultiplier), baseline ? isTimeMetric(baseline.unit, baseline.name) : false);
}

export function calculateMobilityDecay(
  originalValue: number,
  daysOff: number,
  profile: UserProfile,
  layoff: Layoff,
  personalMultiplier = 1,
  baseline?: Baseline,
) {
  return resultFromLoss(originalValue, mobilityLossPercent(daysOff, profile, layoff, personalMultiplier), baseline ? isTimeMetric(baseline.unit, baseline.name) : false);
}

export function calculateBaselineDecay(
  baseline: Baseline,
  daysOff: number,
  profile: UserProfile,
  layoff: Layoff,
  personalMultiplier = 1,
) {
  if (!isBaselineAffected(baseline, layoff)) {
    return { predicted: baseline.value, confidence: 0, percentLost: 0 };
  }
  if (baseline.type === "strength") return calculateStrengthDecay(baseline.value, daysOff, profile, layoff, personalMultiplier);
  if (baseline.type === "cardio") return calculateCardioDecay(baseline.value, baseline.unit, daysOff, profile, layoff, personalMultiplier, baseline.name);
  if (baseline.type === "sport") return calculateSportDecay(baseline.value, daysOff, profile, layoff, personalMultiplier, baseline);
  return calculateMobilityDecay(baseline.value, daysOff, profile, layoff, personalMultiplier, baseline);
}

export function generateStrengthReturnPlan(currentEstimate: number, originalValue: number, profile: UserProfile, baseline?: Baseline, difficultyMultiplier = 1): WeeklyPlan {
  const unit = baseline?.unit ?? (profile.unitSystem === "metric" ? "kg" : "lbs");
  const repLabel = baseline?.inputKind === "bodyweight_reps" ? "reps" : baseline?.reps ? `${baseline.reps}RM` : "working max";
  const isLoad = baseline?.inputKind !== "bodyweight_reps" && !/reps/i.test(unit);
  const targets = [
    { week: 1, percent: 0.7, focus: "Restore positions and bar speed with low soreness risk." },
    { week: 2, percent: 0.825, focus: "Rebuild normal volume while keeping reps crisp." },
    { week: 3, percent: 0.925, focus: "Approach prior performance and test only if warmups move well." },
  ];

  return {
    type: "strength",
    difficultyMultiplier,
    weeks: targets.map((week) => ({
      week: week.week,
      focus: week.focus,
      items: ["Day 1", "Day 3", "Day 5"].map((day, index) => ({
        day,
        title: index === 2 && week.week === 3 ? "Controlled test exposure" : baseline?.modality === "machine" ? "Machine pattern practice" : baseline?.modality === "bodyweight" ? "Calisthenics volume" : "Strength practice",
        target: isLoad
          ? `${formatDisplayValue(Math.floor(Math.min(originalValue, currentEstimate) * week.percent * difficultyMultiplier), unit, profile.unitSystem).text} based on ${repLabel}`
          : `${Math.max(1, Math.round(Math.min(originalValue, currentEstimate) * week.percent * difficultyMultiplier))} ${unit}`,
        notes:
          index === 0
            ? "3 to 4 easy sets, stop 3 reps shy of failure. Match the same setup you used for the baseline."
            : "Add volume only if joints, tempo, and range of motion feel normal.",
      })),
    })),
  };
}

export function generateCardioReturnPlan(currentEstimate: number, originalValue: number, difficultyMultiplier = 1): WeeklyPlan {
  const base = Math.max(currentEstimate, originalValue);
  return {
    type: "cardio",
    difficultyMultiplier,
    weeks: [1, 2, 3].map((week) => ({
      week,
      focus: week === 1 ? "Easy aerobic rhythm and short strides." : week === 2 ? "Normal frequency with restrained intensity." : "Reintroduce benchmark pace gradually.",
      items: [
        {
          day: "Session 1",
          title: "Easy aerobic",
          target: `${Math.round((20 + week * 8) * difficultyMultiplier)} min at conversational effort`,
          notes: "Keep breathing controlled. Cut the session if symptoms or pain return.",
        },
        {
          day: "Session 2",
          title: "Pace touch",
          target: `${formatDuration(Math.floor(base * (1.08 - week * 0.02) / difficultyMultiplier), "seconds")} benchmark equivalent`,
          notes: "Short intervals only; this is rhythm practice, not a max test.",
        },
      ],
    })),
  };
}

export function generateSportReturnPlan(difficultyMultiplier = 1): WeeklyPlan {
  return {
    type: "sport",
    difficultyMultiplier,
    weeks: [1, 2, 3].map((week) => ({
      week,
      focus: week === 1 ? "Technique before intensity." : week === 2 ? "Build elastic contacts and acceleration quality." : "Return to near-full outputs with full recovery.",
      items: [
        {
          day: "Skill day",
          title: "Technical rehearsal",
          target: `${Math.round((week === 1 ? 60 : week === 2 ? 75 : 90) * difficultyMultiplier)}% intensity`,
          notes: "Skill fades slower than physical output, so keep reps sharp and stop before mechanics slip.",
        },
        {
          day: "Power day",
          title: "Progressive outputs",
          target: `${Math.round((4 + week * 2) * difficultyMultiplier)} high-quality reps`,
          notes: "Full rest between reps. Quality is the progression.",
        },
      ],
    })),
  };
}

export function generateMobilityReturnPlan(difficultyMultiplier = 1): WeeklyPlan {
  return {
    type: "mobility",
    difficultyMultiplier,
    weeks: [1, 2, 3].map((week) => ({
      week,
      focus: week === 1 ? "Rebuild positions gently." : week === 2 ? "Increase range and control." : "Return to normal flow complexity.",
      items: [
        {
          day: "Session 1",
          title: "Controlled range work",
          target: `${Math.round((week === 1 ? 50 : week === 2 ? 70 : 85) * difficultyMultiplier)}% of normal duration`,
          notes: "Keep breathing easy and avoid forcing end-range positions after time off.",
        },
        {
          day: "Session 2",
          title: "Balance or hold practice",
          target: `${Math.round((3 + week) * difficultyMultiplier)} clean attempts`,
          notes: "Stop before shaking or compensation changes the movement standard.",
        },
      ],
    })),
  };
}

export function calculatePersonalMultiplier(returnTests: ReturnTest[]) {
  return modelPersonalMultiplier(returnTests);
}

export function generateDecayCurveData(
  baseline: Baseline,
  profile: UserProfile,
  layoff: Layoff,
  totalDays: number,
  personalMultiplier = 1,
): Array<{ day: number; value: number; lower: number; upper: number; confidence: number }> {
  return Array.from({ length: totalDays + 1 }, (_, day) => ({
    day,
    ...(() => {
      const result = calculateBaselineDecay(baseline, day, profile, layoff, personalMultiplier);
      const delta = result.predicted * (result.confidence / 100);
      return {
        value: result.predicted,
        lower: Math.max(0, result.predicted - delta),
        upper: result.predicted + delta,
        confidence: result.confidence,
      };
    })(),
  }));
}
