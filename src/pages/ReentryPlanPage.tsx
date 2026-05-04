import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFitDecay } from '../lib/DataContext';
import { calculateBaselineDecay, generateCardioReturnPlan, generateMobilityReturnPlan, generateSportReturnPlan, generateStrengthReturnPlan } from '../lib/calculations';
import { daysBetween, todayIso } from '../lib/date';
import { formatNumber } from '../lib/format';
import { personalMultiplierForType } from '../lib/personalization';
import { ScienceTooltip } from '../components/ScienceTooltip';
import type { WeeklyPlan } from '../types';

const INTENSITY_COLORS: Record<string, { bg: string; color: string }> = {
  Low:      { bg: 'var(--green-dim)',  color: 'var(--green)' },
  Moderate: { bg: 'var(--amber-dim)',  color: 'var(--amber)' },
  High:     { bg: 'var(--accent-dim)', color: 'var(--accent)' },
};

function getIntensity(focus: string): string {
  const f = focus.toLowerCase();
  if (f.includes('low') || f.includes('light') || f.includes('easy') || f.includes('50%')) return 'Low';
  if (f.includes('high') || f.includes('90%') || f.includes('heavy')) return 'High';
  return 'Moderate';
}

function FeltDots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            background: n <= value ? 'var(--accent)' : 'var(--border)',
            transition: 'background 150ms',
          }}
        />
      ))}
    </div>
  );
}

export function ReentryPlanPage() {
  const { layoffId } = useParams();
  const { data, addWorkoutLog, updateWorkoutLog, updateLayoff } = useFitDecay();
  const navigate = useNavigate();
  const [feltMap, setFeltMap] = useState<Record<string, number>>({});
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const profile = data.profile!;
  const layoff = data.layoffs.find((l) => l.id === layoffId)
    ?? data.layoffs.find((l) => !l.endDate)
    ?? data.layoffs[0];

  if (!layoff) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>No layoff selected yet. Log what happened, and FitDecay will build the ramp back.</p>
        <button className="btn-primary" onClick={() => navigate('/layoffs/new')}>Log a layoff</button>
      </div>
    );
  }

  const days = daysBetween(layoff.startDate, layoff.endDate);
  const difficulty = layoff.difficultyMultiplier ?? 1;
  const plans: WeeklyPlan[] = data.baselines.flatMap((baseline) => {
    const mult = personalMultiplierForType(baseline.type, data.baselines, data.returnTests);
    const estimate = calculateBaselineDecay(baseline, days, profile, layoff, mult).predicted;
    if (baseline.type === 'strength') return [{ ...generateStrengthReturnPlan(estimate, baseline.value, profile, baseline, difficulty), baselineName: baseline.name }];
    if (baseline.type === 'cardio')   return [{ ...generateCardioReturnPlan(estimate, baseline.value, difficulty), baselineName: baseline.name }];
    if (baseline.type === 'sport') return [{ ...generateSportReturnPlan(difficulty), baselineName: baseline.name }];
    return [{ ...generateMobilityReturnPlan(difficulty), baselineName: baseline.name }];
  });

  const allSessionKeys = plans.flatMap((plan) =>
    plan.weeks.flatMap((week) => week.items.map((item) => `${plan.baselineName}-${week.week}-${item.day}`))
  );
  const totalSessions = allSessionKeys.length;
  const completedCount = completedKeys.size;
  const progressPct = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
  const weeklyLogs = data.workoutLogs.filter((log) => log.layoffId === layoff.id);
  const adaptiveWeek = [1, 2, 3].map((week) => {
    const logs = weeklyLogs.filter((log) => log.week === week);
    const avg = logs.length ? logs.reduce((sum, log) => sum + log.felt, 0) / logs.length : 0;
    return { week, logs, avg };
  }).find((entry) => entry.logs.length >= 3 && (entry.avg <= 2 || entry.avg >= 4.5));

  function toggleComplete(plan: WeeklyPlan, weekNum: number, itemDay: string, itemTitle: string) {
    const key = `${plan.baselineName}-${weekNum}-${itemDay}`;
    setCompletedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        const felt = feltMap[key] ?? 4;
        addWorkoutLog({ id: crypto.randomUUID(), layoffId: layoff.id, label: `${plan.baselineName}: ${itemTitle}`, week: weekNum, completedAt: todayIso(), felt, notes: noteDrafts[key] });
      }
      return next;
    });
  }

  function saveNote(key: string, plan: WeeklyPlan, weekNum: number, itemTitle: string, note: string) {
    const label = `${plan.baselineName}: ${itemTitle}`;
    const existing = data.workoutLogs.find((log) => log.layoffId === layoff.id && log.week === weekNum && log.label === label);
    if (existing) updateWorkoutLog({ ...existing, notes: note.trim() || undefined });
  }

  // Recovery projection: estimate % recovered at end of each week
  const recoveryPoints = [0, 1, 2, 3].map((weekIdx) => {
    if (data.baselines.length === 0) return { label: weekIdx === 0 ? 'Today' : `Week ${weekIdx}`, pct: 0 };
    const daysFromNow = weekIdx * 7;
    const recoveryPct = Math.min(100, weekIdx === 0 ? 0 : 20 + weekIdx * 25 + Math.random() * 5);
    return { label: weekIdx === 0 ? 'Today' : `Week ${weekIdx}`, pct: Number(recoveryPct.toFixed(0)), daysFromNow };
  });

  // Better: use the actual decay to estimate recovery trajectory
  const avgPercentLost = data.baselines.length > 0
    ? data.baselines.reduce((sum, b) => {
        const mult = personalMultiplierForType(b.type, data.baselines, data.returnTests);
        return sum + calculateBaselineDecay(b, days, profile, layoff, mult).percentLost;
      }, 0) / data.baselines.length
    : 0;

  const recoveryMilestones = [
    { label: 'Today', pct: 0, sublabel: `−${formatNumber(avgPercentLost, 0)}% from baseline` },
    { label: 'Week 1', pct: Math.min(100, avgPercentLost * 0.35), sublabel: 'Neural adaptations return' },
    { label: 'Week 2', pct: Math.min(100, avgPercentLost * 0.65), sublabel: 'Volume tolerance rebuilding' },
    { label: 'Week 3', pct: Math.min(100, avgPercentLost * 0.90), sublabel: 'Near baseline expected' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => navigate(layoffId ? `/layoffs/${layoffId}` : '/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {layoffId ? 'Decay Detail' : 'Dashboard'}
        </button>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Re-Entry Plan</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 8 }}>3-Week Return Plan</span>
          <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {days}-day {layoff.reason} recovery
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
            A conservative progressive load back to baseline.
            {difficulty !== 1 ? ` Plan adjusted: ${difficulty < 1 ? '−10%' : '+10%'} intensity.` : ''}
          </p>
          {difficulty !== 1 && (
            <button className="btn-ghost pressable" style={{ marginTop: 10 }} onClick={() => updateLayoff({ ...layoff, difficultyMultiplier: 1 })}>Reset to default</button>
          )}
        </div>
        {totalSessions > 0 && (
          <div style={{ textAlign: 'right' }}>
            <span className="label" style={{ display: 'block', marginBottom: 4 }}>Progress</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {completedCount}<span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>/{totalSessions}</span>
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalSessions > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
            <span>{completedCount} of {totalSessions} sessions complete</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatNumber(progressPct, 0)}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 3,
              width: `${progressPct}%`,
              transition: 'width 400ms ease-out',
            }} />
          </div>
        </div>
      )}

      {adaptiveWeek && (
        <div style={{ padding: '14px 18px', borderRadius: 10, background: adaptiveWeek.avg <= 2 ? 'var(--amber-dim)' : 'var(--green-dim)', border: `1px solid ${adaptiveWeek.avg <= 2 ? 'rgba(251,191,36,.24)' : 'rgba(74,222,128,.24)'}` }}>
          <div style={{ fontWeight: 700, color: adaptiveWeek.avg <= 2 ? 'var(--amber)' : 'var(--green)' }}>
            {adaptiveWeek.avg <= 2 ? `You've felt rough this week.` : `You're crushing it.`}
          </div>
          <p style={{ margin: '4px 0 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
            {adaptiveWeek.avg <= 2 ? `Consider repeating Week ${adaptiveWeek.week} or dropping intensity 10%.` : 'Want to progress faster? Increase targets by 10%.'}
          </p>
          <button className="btn-primary pressable" onClick={() => updateLayoff({ ...layoff, difficultyMultiplier: adaptiveWeek.avg <= 2 ? 0.9 : 1.1 })}>
            {adaptiveWeek.avg <= 2 ? 'Adjust plan' : 'Speed up plan'}
          </button>
        </div>
      )}

      {/* Injury warning */}
      {layoff.reason === 'injury' && (
        <div style={{
          padding: '14px 18px',
          background: 'var(--amber-dim)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 10,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M8 2L14 13H2L8 2Z" stroke="var(--amber)" strokeWidth="1.4" strokeLinejoin="round" />
            <line x1="8" y1="6" x2="8" y2="9.5" stroke="var(--amber)" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.7" fill="var(--amber)" />
          </svg>
          <p style={{ fontSize: 13, color: 'var(--amber)', margin: 0, lineHeight: 1.5 }}>
            Injury-related layoff detected. Consult a medical professional before resuming training. Adjust intensities based on your pain levels.
          </p>
        </div>
      )}

      {/* No baselines state */}
      {plans.length === 0 && (
        <div style={{ padding: '32px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16 }}>Add one baseline first. The plan needs a target to protect.</p>
          <button className="btn-primary" onClick={() => navigate('/baselines')}>Add baselines</button>
        </div>
      )}

      {/* Plan weeks per baseline */}
      {plans.map((plan) => (
        <div key={plan.baselineName ?? plan.type}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <span className="label" style={{ display: 'block', marginBottom: 4 }}>{plan.type}</span>
              <h2 className="tight" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {plan.baselineName ?? plan.type}
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {plan.weeks.map((week) => {
              const intensity = getIntensity(week.focus);
              const colors = INTENSITY_COLORS[intensity] ?? INTENSITY_COLORS.Moderate;
              const weekCompleted = week.items.filter((item) => completedKeys.has(`${plan.baselineName}-${week.week}-${item.day}`)).length;
              return (
                <div key={week.week} style={{
                  padding: '20px 22px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                  {/* Week header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="label" style={{ display: 'block', marginBottom: 4 }}>Week {week.week}</span>
                      <h3 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {week.focus}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px',
                        borderRadius: 4,
                        background: colors.bg,
                        color: colors.color,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}>
                        {intensity}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{weekCompleted}/{week.items.length}</span>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {week.items.map((item) => {
                      const key = `${plan.baselineName}-${week.week}-${item.day}`;
                      const done = completedKeys.has(key);
                      const felt = feltMap[key] ?? 4;
                      return (
                        <div key={key} style={{
                          padding: '12px 14px',
                          background: done ? 'var(--surface)' : 'var(--bg)',
                          border: `1px solid ${done ? 'rgba(197,255,61,0.15)' : 'var(--border)'}`,
                          borderRadius: 8,
                          transition: 'all 200ms',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{item.day}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>{item.target}</div>
                              {item.notes && (
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5 }}>{item.notes}</div>
                              )}
                            </div>
                            <button
                              onClick={() => toggleComplete(plan, week.week, item.day, item.title)}
                              style={{
                                width: 28, height: 28, borderRadius: 6, border: `1px solid ${done ? 'rgba(197,255,61,0.3)' : 'var(--border)'}`,
                                background: done ? 'var(--accent-dim)' : 'transparent',
                                cursor: 'pointer', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: done ? 'var(--accent)' : 'var(--text-tertiary)',
                                transition: 'all 150ms',
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>

                          {/* Feel rating — shown after completion */}
                          {done && (
                            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Felt</span>
                                <FeltDots value={felt} onChange={(v) => {
                                  setFeltMap((prev) => ({ ...prev, [key]: v }));
                                  const existing = data.workoutLogs.find((log) => log.layoffId === layoff.id && log.week === week.week && log.label === `${plan.baselineName}: ${item.title}`);
                                  if (existing) updateWorkoutLog({ ...existing, felt: v });
                                }} />
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>{felt}/5</span>
                              </div>
                              <textarea
                                className="field"
                                placeholder="Knees clicky on the second set, or felt amazing, no DOMS."
                                value={noteDrafts[key] ?? ''}
                                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                                onBlur={(e) => saveNote(key, plan, week.week, item.title, e.target.value)}
                                style={{ minHeight: 70, fontSize: 12 }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recovery projection timeline */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 16 }}>Recovery projection <ScienceTooltip kind="recovery" /></span>
        <div style={{
          padding: '24px 28px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
            {/* Connecting gradient line */}
            <div style={{
              position: 'absolute',
              left: '12.5%', right: '12.5%',
              top: '50%', transform: 'translateY(-28px)',
              height: 2,
              background: 'linear-gradient(to right, var(--red), var(--amber), var(--green), var(--accent))',
              borderRadius: 1,
              zIndex: 0,
            }} />

            {recoveryMilestones.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                {/* Value bubble */}
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--surface)',
                  border: `1px solid ${i === 0 ? 'var(--red)' : i === 3 ? 'rgba(197,255,61,0.3)' : 'var(--border)'}`,
                  borderRadius: 8,
                  textAlign: 'center',
                  minWidth: 60,
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 15, fontWeight: 700,
                    color: i === 0 ? 'var(--red)' : i === 3 ? 'var(--accent)' : 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {i === 0 ? `−${formatNumber(avgPercentLost, 0)}%` : `+${formatNumber(m.pct, 0)}%`}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {i === 0 ? 'lost' : 'recovered'}
                  </div>
                </div>

                {/* Node dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i === 0 ? 'var(--red)' : i === 3 ? 'var(--accent)' : 'var(--border)',
                  border: '2px solid var(--card)',
                  boxShadow: i === 3 ? '0 0 8px rgba(197,255,61,0.4)' : 'none',
                }} />

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.4, maxWidth: 80 }}>{m.sublabel}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20, marginBottom: 0, lineHeight: 1.5 }}>
            Recovery timeline based on {days}-day {layoff.reason} layoff. Individual response varies ±20%. These projections assume consistent adherence to the plan above.
          </p>
        </div>
      </div>
    </div>
  );
}
