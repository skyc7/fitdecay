import { useState } from "react";
import type { FormEvent } from "react";
import { modalityLabels, optionsForType } from "../data/exerciseOptions";
import type { Baseline, BaselineInputKind, QualityType, TrainingModality } from "../types";
import { todayIso } from "../lib/date";

const inputKindLabels: Record<BaselineInputKind, string> = {
  max_load: "Max load",
  rep_max: "Rep max load",
  bodyweight_reps: "Max reps",
  time: "Time",
  distance: "Distance",
  height: "Height",
  score: "Score",
  hold_time: "Hold time",
  range_of_motion: "Range of motion",
};

const helperExamples: Record<QualityType, string[]> = {
  strength: ["Machine chest press 10RM", "Lat pulldown 12RM", "Dumbbell bench 8RM", "Max pull-ups"],
  cardio: ["5K time", "2K row", "FTP watts", "VO2 max estimate"],
  sport: ["Vertical jump", "40-yard dash", "Broad jump", "Agility shuttle"],
  mobility: ["Sit-and-reach", "Crow pose hold", "Pilates Hundred reps", "Single-leg balance"],
};

export function BaselineForm({ onSave, initial }: { onSave: (baseline: Baseline) => void; initial?: Baseline }) {
  const [type, setType] = useState<QualityType>(initial?.type ?? "strength");
  const [name, setName] = useState(initial?.name ?? "");
  const [selectedExercise, setSelectedExercise] = useState(initial?.name ?? "");
  const [value, setValue] = useState(initial?.value ? String(initial.value) : "");
  const [unit, setUnit] = useState(initial?.unit ?? "kg");
  const [modality, setModality] = useState<TrainingModality>(initial?.modality ?? "barbell");
  const [inputKind, setInputKind] = useState<BaselineInputKind>(initial?.inputKind ?? "rep_max");
  const [reps, setReps] = useState(initial?.reps ? String(initial.reps) : "5");
  const [loadContext, setLoadContext] = useState(initial?.loadContext ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [customMode, setCustomMode] = useState(Boolean(initial && !optionsForType(initial.type).some((option) => option.name === initial.name)));

  function updateType(nextType: QualityType) {
    setType(nextType);
    const firstOption = optionsForType(nextType)[0];
    setCustomMode(false);
    setSelectedExercise(firstOption.name);
    setName(firstOption.name);
    setUnit(firstOption.unit);
    setModality(firstOption.modality);
    setInputKind(firstOption.inputKind);
    setReps(firstOption.defaultReps ? String(firstOption.defaultReps) : "");
  }

  function updateExercise(value: string) {
    if (value === "custom") {
      setCustomMode(true);
      setSelectedExercise("custom");
      setName("");
      return;
    }
    const option = optionsForType(type).find((item) => item.name === value);
    setSelectedExercise(value);
    setName(value);
    if (option) {
      setUnit(option.unit);
      setModality(option.modality);
      setInputKind(option.inputKind);
      setReps(option.defaultReps ? String(option.defaultReps) : "");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const numeric = Number(value);
    const parsedReps = reps ? Number(reps) : undefined;
    if (!name.trim()) return setError("Name the metric you want to track.");
    if (!Number.isFinite(numeric) || numeric <= 0) return setError("Enter a positive performance value.");
    if (!unit.trim()) return setError("Add a unit such as kg, seconds, cm, or inches.");
    if (inputKind === "rep_max" && (!parsedReps || !Number.isFinite(parsedReps) || parsedReps <= 0)) {
      return setError("Add the rep max count, such as 5 for a 5RM or 10 for a 10RM.");
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      type,
      name: name.trim(),
      value: numeric,
      unit: unit.trim(),
      recordedAt: initial?.recordedAt ?? todayIso(),
      notes: notes.trim() || undefined,
      isCurrentPr: initial?.isCurrentPr ?? true,
      modality,
      inputKind,
      reps: inputKind === "rep_max" ? parsedReps : undefined,
      loadContext: loadContext.trim() || undefined,
    });
    if (!initial) {
      setName("");
      setSelectedExercise("");
      setValue("");
      setLoadContext("");
      setNotes("");
      setError("");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[.8fr_1.25fr_.9fr_.85fr] md:items-end">
        <label className="grid gap-2">
          <span className="label">Category</span>
          <select className="field" value={type} onChange={(event) => updateType(event.target.value as QualityType)}>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="sport">Sport</option>
            <option value="mobility">Yoga / Pilates / Mobility</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Exercise or test</span>
          <select className="field" value={customMode ? "custom" : selectedExercise || name} onChange={(event) => updateExercise(event.target.value)}>
            <option value="" disabled>
              Select a metric
            </option>
            {optionsForType(type).map((option) => (
              <option value={option.name} key={option.name}>
                {option.name} - {modalityLabels[option.modality]}
              </option>
            ))}
            <option value="custom">Add custom...</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Style</span>
          <select className="field" value={modality} onChange={(event) => setModality(event.target.value as TrainingModality)}>
            {Object.entries(modalityLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Measurement</span>
          <select className="field" value={inputKind} onChange={(event) => setInputKind(event.target.value as BaselineInputKind)}>
            {Object.entries(inputKindLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[.8fr_.6fr_.7fr_1.2fr_auto] md:items-end">
        <label className="grid gap-2">
          <span className="label">Value</span>
          <input className="field" value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" placeholder="165" />
        </label>
        {inputKind === "rep_max" ? (
          <label className="grid gap-2">
            <span className="label">Rep max</span>
            <input className="field" value={reps} onChange={(event) => setReps(event.target.value)} inputMode="numeric" placeholder="10" />
          </label>
        ) : (
          <div className="hidden md:block" />
        )}
        <label className="grid gap-2">
          <span className="label">Unit</span>
          <input className="field" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" />
        </label>
        <label className="grid gap-2">
          <span className="label">Context</span>
          <input className="field" value={loadContext} onChange={(event) => setLoadContext(event.target.value)} placeholder="Seat 4, pin-loaded, strict tempo..." />
        </label>
        <button className="btn-primary md:mb-0.5" type="submit">
          Save
        </button>
      </div>

      {customMode ? (
        <label className="grid gap-2">
          <span className="label">Custom metric name</span>
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Trap Bar Deadlift 3RM, Beep Test, Approach Jump..." />
        </label>
      ) : null}
      <label className="grid gap-2">
        <span className="label">Notes</span>
        <textarea className="field min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional: machine brand, range of motion standard, yoga pose variation, Pilates spring setting..." />
      </label>
      <div className="flex flex-wrap gap-2">
        {helperExamples[type].map((example) => (
          <button
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-teal-300/50 hover:text-teal-200"
            type="button"
            onClick={() => {
              setCustomMode(true);
              setSelectedExercise("custom");
              setName(example);
            }}
            key={example}
          >
            {example}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
