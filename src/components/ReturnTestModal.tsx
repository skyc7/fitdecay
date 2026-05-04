import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useFitDecay } from "../lib/DataContext";
import { calculateBaselineDecay } from "../lib/calculations";
import { daysBetween, todayIso } from "../lib/date";
import { formatDisplayValue, formatNumber } from "../lib/format";
import { personalMultiplierForType } from "../lib/personalization";
import type { Baseline, Layoff, QualityType, ReturnTest } from "../types";

function multiplierText(type: QualityType, value: number) {
  const pct = Math.abs((value - 1) * 100);
  if (Math.abs(value - 1) < 0.01) return `${type} model stayed steady`;
  return `${type} model: you decay ${formatNumber(pct, 0)}% ${value < 1 ? "slower" : "faster"} than average`;
}

export function ReturnTestModal({ layoff, open, onClose }: { layoff: Layoff | null; open: boolean; onClose: () => void }) {
  const { data, addReturnTests } = useFitDecay();
  const [values, setValues] = useState<Record<string, string>>({});
  const [felt, setFelt] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [celebration, setCelebration] = useState<{ old: number; next: number; type: QualityType } | null>(null);

  const profile = data.profile!;
  const rows = useMemo(() => {
    if (!layoff) return [];
    const days = daysBetween(layoff.startDate, layoff.endDate);
    return data.baselines.map((baseline) => {
      const mult = personalMultiplierForType(baseline.type, data.baselines, data.returnTests);
      return { baseline, prediction: calculateBaselineDecay(baseline, days, profile, layoff, mult), mult };
    });
  }, [data.baselines, data.returnTests, layoff, profile]);

  function submit() {
    if (!layoff) return;
    const tests: ReturnTest[] = rows
      .filter(({ baseline }) => !skipped[baseline.id] && values[baseline.id])
      .map(({ baseline, prediction }) => ({
        id: crypto.randomUUID(),
        layoffId: layoff.id,
        baselineId: baseline.id,
        predictedValue: prediction.predicted,
        actualValue: Number(values[baseline.id]),
        testedAt: todayIso(),
      }));
    if (!tests.length) return;
    const firstType = rows.find(({ baseline }) => tests.some((test) => test.baselineId === baseline.id))?.baseline.type ?? "strength";
    const old = personalMultiplierForType(firstType, data.baselines, data.returnTests);
    const next = personalMultiplierForType(firstType, data.baselines, [...tests, ...data.returnTests]);
    addReturnTests(tests);
    setCelebration({ old, next, type: firstType });
  }

  function resetAndClose() {
    setValues({});
    setFelt({});
    setSkipped({});
    setCelebration(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && layoff ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.58)", display: "grid", placeItems: "end center", padding: 16 }}
          onMouseDown={(e) => e.target === e.currentTarget && resetAndClose()}
        >
          <motion.section
            className="mobile-sheet"
            initial={{ y: 80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            style={{ width: "min(760px, 100%)", maxHeight: "86vh", overflow: "auto", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}
          >
            {celebration ? (
              <Celebration oldValue={celebration.old} nextValue={celebration.next} type={celebration.type} onDone={resetAndClose} />
            ) : (
              <>
                <span className="label">Return test</span>
                <h2 className="tight" style={{ fontSize: 26, margin: "8px 0 6px" }}>How did your first session back go?</h2>
                <p style={{ color: "var(--text-tertiary)", fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
                  Log what you actually hit. FitDecay will quietly adjust future predictions from this.
                </p>
                {rows.length === 0 ? (
                  <div className="card" style={{ padding: 18 }}>No baselines yet. Add one benchmark, and this feedback loop starts earning its keep.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {rows.map(({ baseline, prediction }) => (
                      <ReturnRow
                        key={baseline.id}
                        baseline={baseline}
                        predicted={prediction.predicted}
                        confidence={prediction.confidence}
                        value={values[baseline.id] ?? ""}
                        skipped={Boolean(skipped[baseline.id])}
                        felt={felt[baseline.id] ?? 4}
                        unitSystem={profile.unitSystem}
                        onValue={(value) => setValues((prev) => ({ ...prev, [baseline.id]: value }))}
                        onSkip={() => setSkipped((prev) => ({ ...prev, [baseline.id]: !prev[baseline.id] }))}
                        onFelt={(value) => setFelt((prev) => ({ ...prev, [baseline.id]: value }))}
                      />
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
                  <button className="btn-ghost pressable" onClick={resetAndClose}>Close</button>
                  <button className="btn-primary pressable" onClick={submit}>Save return tests</button>
                </div>
              </>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ReturnRow({
  baseline,
  predicted,
  confidence,
  value,
  skipped,
  felt,
  onValue,
  onSkip,
  onFelt,
  unitSystem,
}: {
  baseline: Baseline;
  predicted: number;
  confidence: number;
  value: string;
  skipped: boolean;
  felt: number;
  onValue(value: string): void;
  onSkip(): void;
  onFelt(value: number): void;
  unitSystem: "metric" | "imperial" | "us";
}) {
  const actual = Number(value);
  const delta = value && Number.isFinite(actual) ? actual - predicted : 0;
  const display = formatDisplayValue(predicted, baseline.unit, unitSystem);
  return (
    <motion.div layout className="card" style={{ padding: 14, opacity: skipped ? 0.48 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{baseline.name}</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: 12 }}>Predicted {display.text} ± {formatNumber(confidence, 0)}%</div>
        </div>
        <button className="btn-ghost pressable" type="button" onClick={onSkip} style={{ minHeight: 44 }}>{skipped ? "Include" : "Skip"}</button>
      </div>
      {!skipped ? (
        <>
          <input
            className="field mono"
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => onValue(e.target.value)}
            placeholder={`Actual ${baseline.unit}`}
            style={{ marginTop: 12, fontSize: 24, padding: "14px 16px" }}
          />
          {value ? (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8, color: delta >= 0 ? "var(--green)" : "var(--red)", fontSize: 13 }}>
              {delta >= 0 ? "+" : ""}{formatNumber(delta, 0)} {baseline.unit} {delta >= 0 ? "above" : "below"} predicted
            </motion.div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>How did it feel?</span>
            {[1, 2, 3, 4, 5].map((dot) => (
              <button key={dot} className="pressable" onClick={() => onFelt(dot)} style={{ width: 44, height: 44, border: 0, background: "transparent" }}>
                <span style={{ display: "block", width: 10, height: 10, borderRadius: "50%", margin: "0 auto", background: dot <= felt ? "var(--accent)" : "var(--border)" }} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

function Celebration({ oldValue, nextValue, type, onDone }: { oldValue: number; nextValue: number; type: QualityType; onDone: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "22px 8px" }}>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent)", color: "var(--bg)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 34, fontWeight: 900 }}
      >
        ✓
      </motion.div>
      <h2 className="tight" style={{ fontSize: 28, margin: 0 }}>Your model just got smarter.</h2>
      <p style={{ color: "var(--text-tertiary)", lineHeight: 1.6 }}>{multiplierText(type, nextValue)}</p>
      <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} style={{ height: 8, background: "var(--accent)", borderRadius: 999, maxWidth: 260, margin: "18px auto" }} />
      <div className="mono" style={{ fontSize: 22 }}>{oldValue.toFixed(2)} → {nextValue.toFixed(2)}</div>
      <button className="btn-primary pressable" style={{ marginTop: 22 }} onClick={onDone}>Back to FitDecay</button>
    </div>
  );
}
