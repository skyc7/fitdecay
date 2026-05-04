import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartSparkline } from '../components/charts';
import { DecayAreaChart } from '../components/charts';
import { ReturnTestModal } from '../components/ReturnTestModal';
import { ScienceTooltip } from '../components/ScienceTooltip';
import { useFitDecay } from '../lib/DataContext';
import { calculateBaselineDecay, generateDecayCurveData } from '../lib/calculations';
import { daysBetween, todayIso } from '../lib/date';
import { formatDisplayValue, formatNumber } from '../lib/format';
import { personalMultiplierForType } from '../lib/personalization';
import type { Baseline, Layoff } from '../types';

function severityColor(pct: number) {
  if (pct <= 5) return 'var(--green)';
  if (pct <= 15) return 'var(--amber)';
  return 'var(--red)';
}
function severityBg(pct: number) {
  if (pct <= 5) return 'var(--green-dim)';
  if (pct <= 15) return 'var(--amber-dim)';
  return 'var(--red-dim)';
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

interface ActivityItem {
  id: string;
  type: 'layoff_start' | 'layoff_end' | 'baseline_update';
  text: string;
  daysAgo: number;
}

function buildActivityFeed(layoffs: Layoff[], baselines: Baseline[]): ActivityItem[] {
  const now = Date.now();
  const items: ActivityItem[] = [];
  const msPerDay = 86_400_000;

  layoffs.forEach((l) => {
    items.push({
      id: `ls-${l.id}`,
      type: 'layoff_start',
      text: `Logged layoff — ${l.reason.charAt(0).toUpperCase() + l.reason.slice(1)}`,
      daysAgo: Math.floor((now - new Date(`${l.startDate}T00:00:00`).getTime()) / msPerDay),
    });
    if (l.endDate) {
      const dur = daysBetween(l.startDate, l.endDate);
      items.push({
        id: `le-${l.id}`,
        type: 'layoff_end',
        text: `Ended layoff — ${dur} day${dur === 1 ? '' : 's'} off`,
        daysAgo: Math.floor((now - new Date(`${l.endDate}T00:00:00`).getTime()) / msPerDay),
      });
    }
  });

  baselines.forEach((b) => {
    items.push({
      id: `bu-${b.id}`,
      type: 'baseline_update',
      text: `Updated ${b.name} baseline`,
      daysAgo: Math.floor((now - new Date(`${b.recordedAt}T00:00:00`).getTime()) / msPerDay),
    });
  });

  return items.sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 6);
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  layoff_start: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="#F87171" strokeWidth="1.3" />
      <path d="M6.5 4V7" stroke="#F87171" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="6.5" cy="8.8" r="0.6" fill="#F87171" />
    </svg>
  ),
  layoff_end: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="#4ADE80" strokeWidth="1.3" />
      <path d="M4 6.5L6 8.5L9.5 4.5" stroke="#4ADE80" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  baseline_update: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 9.5L4.5 5.5L7 7.5L10 3.5L12 5" stroke="#A1A1AA" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function DashboardPage() {
  const { data, updateLayoff, addWeightLog } = useFitDecay();
  const navigate = useNavigate();
  const [returnLayoff, setReturnLayoff] = useState<Layoff | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const resetTimer = useRef<number | null>(null);
  const profile = data.profile!;
  const activeLayoff = data.layoffs.find((l) => !l.endDate);
  const beginnerMode = data.settings.beginnerMode;
  const days = activeLayoff ? daysBetween(activeLayoff.startDate, null) : 0;
  const [whatIfDay, setWhatIfDay] = useState(days);

  useEffect(() => setWhatIfDay(days), [days, activeLayoff?.id]);

  const returnPromptLayoff = data.layoffs.find((layoff) =>
    layoff.endDate &&
    daysBetween(layoff.startDate, layoff.endDate) > 3 &&
    !layoff.returnTestPromptDismissed &&
    !data.returnTests.some((test) => test.layoffId === layoff.id)
  );

  // Compute decay for all baselines
  const decayResults = data.baselines.map((b) => {
    const mult = personalMultiplierForType(b.type, data.baselines, data.returnTests);
    const result = activeLayoff
      ? calculateBaselineDecay(b, days, profile, activeLayoff, mult)
      : null;
    return { baseline: b, result, mult };
  });

  // Find worst decaying metric for hero chart
  const worstEntry = activeLayoff
    ? decayResults.reduce((worst, cur) =>
        (cur.result?.percentLost ?? 0) > (worst.result?.percentLost ?? 0) ? cur : worst,
      decayResults[0])
    : null;

  const heroCurveData =
    worstEntry && activeLayoff
      ? generateDecayCurveData(worstEntry.baseline, profile, activeLayoff, Math.max(whatIfDay, days) + 14, worstEntry.mult)
      : [];
  const whatIfResult = worstEntry && activeLayoff
    ? calculateBaselineDecay(worstEntry.baseline, whatIfDay, profile, activeLayoff, worstEntry.mult)
    : null;

  // Training dots — last 28 days
  const trainingDots = Array.from({ length: 28 }, (_, i) => {
    const daysAgo = 27 - i;
    if (activeLayoff && daysAgo < days) return 'rest';
    if (daysAgo % 3 === 0 || daysAgo % 7 === 1) return 'rest';
    return 'train';
  });

  const activity = buildActivityFeed(data.layoffs, data.baselines);
  const worstPct = worstEntry?.result?.percentLost ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, fontFamily: "'Inter', sans-serif" }}>

      {/* Greeting */}
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 0 }}>
          Good {timeOfDay()}, {profile.name}
        </p>
        {beginnerMode && (
          <h1 className="tight" style={{ margin: '8px 0 0', fontSize: 30, color: 'var(--text-primary)' }}>
            {activeLayoff ? "Let's keep your return simple." : "You're in a good place today."}
          </h1>
        )}
      </div>

      {returnPromptLayoff && (
        <div className="card" style={{ padding: 18, borderColor: 'rgba(197,255,61,.28)', background: 'linear-gradient(135deg, var(--card), var(--accent-dim))' }}>
          <span className="label" style={{ color: 'var(--accent)' }}>Feedback loop</span>
          <h2 className="tight" style={{ margin: '8px 0 6px', fontSize: 20 }}>How did your first session back go?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>One quick return test teaches the model how your body actually responds.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn-primary pressable" onClick={() => setReturnLayoff(returnPromptLayoff)}>Log a return test</button>
            <button className="btn-ghost pressable" onClick={() => updateLayoff({ ...returnPromptLayoff, returnTestPromptDismissed: true })}>Not now</button>
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      <div className="card" style={{ padding: '28px 32px', overflow: 'visible' }}>
        {activeLayoff ? (
          <div style={{ display: 'flex', gap: beginnerMode ? 24 : 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Left: counter + status */}
            <div style={{ flex: '0 0 auto', minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block', boxShadow: '0 0 6px rgba(251,191,36,0.4)' }} />
                <span className="label" style={{ color: 'var(--amber)' }}>
                  Active layoff — {activeLayoff.reason.charAt(0).toUpperCase() + activeLayoff.reason.slice(1)}
                </span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 72, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
                {days}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 24 }}>days off</div>

              {worstEntry && worstEntry.result && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{beginnerMode ? 'Main thing to know' : 'Most affected'}</div>
                  <div className="tight" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {beginnerMode ? `${worstEntry.baseline.name} may be down a little.` : worstEntry.baseline.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: severityColor(worstPct), fontVariantNumeric: 'tabular-nums' }}>
                      −{formatNumber(worstPct, 0)}%
                    </span>
                    <ScienceTooltip kind="decay" />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>predicted</span>
                  </div>
                  {beginnerMode && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 300 }}>
                      That is not a verdict. It is a starting point for an easier first week back.
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate(`/layoffs/${activeLayoff.id}`)} style={{ padding: '9px 16px' }}>
                  View full estimate
                </button>
                <button className="btn-ghost" onClick={() => navigate('/plan')} style={{ padding: '9px 16px' }}>
                  Plan my return
                </button>
                <button className="btn-ghost pressable" onClick={() => setWeightOpen(true)} style={{ padding: '9px 16px' }}>
                  Log weight
                </button>
              </div>
            </div>

            {/* Right: decay chart */}
            {!beginnerMode && worstEntry && heroCurveData.length > 1 && (
              <div style={{ flex: 1, minWidth: 260, minHeight: 180 }}>
                <span className="label" style={{ display: 'block', marginBottom: 12 }}>
                  {worstEntry.baseline.name} decay — predicted
                </span>
                <DecayAreaChart
                  data={heroCurveData}
                  todayIdx={days}
                  width={380}
                  height={160}
                  color="var(--accent)"
                  showConfidence={data.settings.showConfidenceBands}
                  valueFormatter={(value) => formatDisplayValue(value, worstEntry.baseline.unit, profile.unitSystem).text.replace(/\s+(kg|lbs|cm|in|km|mi|m|yd|sec)$/i, '')}
                />
                {whatIfResult && (
                  <div style={{ marginTop: 12 }}>
                    <input
                      type="range"
                      min={days}
                      max={days + 60}
                      value={whatIfDay}
                      onChange={(e) => {
                        setWhatIfDay(Number(e.target.value));
                        if (resetTimer.current) window.clearTimeout(resetTimer.current);
                        resetTimer.current = window.setTimeout(() => setWhatIfDay(days), 5000);
                      }}
                      style={{ width: '100%', accentColor: 'var(--accent)', minHeight: 44 }}
                    />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                      If the layoff continues until Day {whatIfDay}, you'll have lost about <strong style={{ color: severityColor(whatIfResult.percentLost) }}>{formatNumber(whatIfResult.percentLost, 0)}%</strong> of {worstEntry.baseline.name}.
                    </p>
                  </div>
                )}
              </div>
            )}
            {beginnerMode && (
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="label" style={{ display: 'block', marginBottom: 12 }}>What to do next</span>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    ['1', 'Keep the layoff logged so estimates stay current.'],
                    ['2', 'When you return, start below what you think you can do.'],
                    ['3', 'After the first session back, log one return test so FitDecay learns.'],
                  ].map(([n, text]) => (
                    <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <span className="mono" style={{ color: 'var(--accent)' }}>{n}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px rgba(74,222,128,0.4)' }} />
                  <span className="label" style={{ color: 'var(--green)' }}>On track</span>
                </div>
                <h2 className="tight" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {data.baselines.length > 0 ? 'No layoff active. Nothing urgent today.' : 'Start with one benchmark.'}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {data.baselines.length > 0
                    ? 'If life interrupts training, log it here and FitDecay will help you return without guessing.'
                    : 'Pick one lift, run, machine, or movement you already know. You can add the rest later.'}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/layoffs/new')}>
                Log a layoff
              </button>
            </div>

            {/* Training dots */}
            {!beginnerMode && <div>
              <span className="label" style={{ display: 'block', marginBottom: 10 }}>Last 28 days</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {trainingDots.map((d, i) => (
                  <div
                    key={i}
                    title={d === 'train' ? 'Training day' : 'Rest day'}
                    style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: d === 'train' ? 'var(--accent)' : 'var(--surface)',
                      border: `1px solid ${d === 'train' ? 'rgba(197,255,61,0.4)' : 'var(--border)'}`,
                    }}
                  />
                ))}
              </div>
            </div>}
          </div>
        )}
      </div>

      {/* ── Metric grid ── */}
      {data.baselines.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="label">{beginnerMode ? 'Your benchmarks' : 'Tracked Baselines'}</span>
            <button
              onClick={() => navigate('/baselines')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 500, padding: 0 }}
            >
              Manage
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
            {(beginnerMode ? decayResults.slice(0, 4) : decayResults).map(({ baseline, result, mult }) => {
              const curveData = activeLayoff
                ? generateDecayCurveData(baseline, profile, activeLayoff, Math.max(days + 1, 14), mult)
                : [];
              const decayPct = result?.percentLost ?? 0;
              const sparkColor = result ? severityColor(decayPct) : 'var(--accent)';

              return (
                <MetricCard
                  key={baseline.id}
                  name={baseline.name}
                  type={baseline.type}
                  baseline={formatDisplayValue(baseline.value, baseline.unit, profile.unitSystem).text}
                  predicted={result ? formatDisplayValue(result.predicted, baseline.unit, profile.unitSystem).text : null}
                  beginnerMode={beginnerMode}
                  decayPct={decayPct}
                  curve={curveData}
                  sparkColor={sparkColor}
                  onClick={() => activeLayoff ? navigate(`/layoffs/${activeLayoff.id}`) : navigate('/baselines')}
                />
              );
            })}
          </div>
          {beginnerMode && data.baselines.length > 4 && (
            <button className="btn-ghost pressable" style={{ marginTop: 12 }} onClick={() => navigate('/baselines')}>
              See all {data.baselines.length} benchmarks
            </button>
          )}
        </div>
      )}

      {data.baselines.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Your slate is clean. Add one baseline and FitDecay can start doing the math quietly in the background.
          </p>
          <button className="btn-primary" onClick={() => navigate('/baselines')}>
            Add baselines
          </button>
        </div>
      )}

      {/* ── Activity feed ── */}
      {!beginnerMode && activity.length > 0 && (
        <div style={{ maxWidth: 560 }}>
          <span className="label" style={{ display: 'block', marginBottom: 16 }}>Recent Activity</span>
          <div>
            {activity.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.baseline_update}
                </div>
                <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}>{item.text}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {item.daysAgo === 0 ? 'Today' : item.daysAgo === 1 ? 'Yesterday' : `${item.daysAgo}d ago`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ReturnTestModal layoff={returnLayoff} open={Boolean(returnLayoff)} onClose={() => setReturnLayoff(null)} />
      {weightOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 260, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'end center', padding: 16 }} onMouseDown={(e) => e.target === e.currentTarget && setWeightOpen(false)}>
          <section className="mobile-sheet card" style={{ width: 'min(420px, 100%)', padding: 20 }}>
            <span className="label">Bodyweight</span>
            <h2 className="tight" style={{ margin: '8px 0 10px' }}>How heavy were you today?</h2>
            <input className="field mono" autoFocus inputMode="decimal" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} placeholder={profile.unitSystem === 'metric' ? 'kg' : 'lbs'} style={{ fontSize: 26, padding: 16 }} />
            <button className="btn-primary pressable" style={{ width: '100%', marginTop: 14 }} onClick={() => {
              const weight = Number(weightValue);
              if (!Number.isFinite(weight) || weight <= 0) return;
              addWeightLog({ id: crypto.randomUUID(), date: todayIso(), weight, unit: profile.unitSystem === 'metric' ? 'kg' : 'lbs', layoffId: activeLayoff?.id });
              setWeightValue('');
              setWeightOpen(false);
            }}>Save weight</button>
          </section>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  name: string;
  type: string;
  baseline: string;
  predicted: string | null;
  decayPct: number;
  curve: Array<{ day: number; value: number }>;
  sparkColor: string;
  beginnerMode: boolean;
  onClick: () => void;
}

function MetricCard({ name, baseline, predicted, decayPct, curve, sparkColor, beginnerMode, onClick }: MetricCardProps) {
  const hasDecay = predicted !== null && decayPct > 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '18px 20px 16px',
        cursor: 'pointer',
        transition: 'background 150ms, border-color 150ms',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--card-hover)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      <span className="label" style={{ display: 'block', marginBottom: 10 }}>{name}</span>

      {/* Baseline value */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>
        {baseline}
      </div>

      {/* Predicted + chip */}
      {predicted !== null && !beginnerMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            ~{predicted}
          </span>
          {hasDecay && (
            <>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 7px', borderRadius: 4,
              background: severityBg(decayPct),
              color: severityColor(decayPct),
              border: `1px solid ${severityColor(decayPct)}22`,
              fontSize: 11, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>
              −{formatNumber(decayPct, 0)}%
            </span>
            <ScienceTooltip kind="decay" />
            </>
          )}
        </div>
      )}

      {/* Sparkline */}
      {curve.length > 1 && !beginnerMode && (
        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          <ChartSparkline data={curve} color={sparkColor} width={120} height={26} />
        </div>
      )}
      {beginnerMode && predicted !== null && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>
          If you are off training, FitDecay will show a safe return target here.
        </p>
      )}
    </div>
  );
}
