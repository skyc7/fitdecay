import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { DecayAreaChart } from '../components/charts';
import { ReturnTestModal } from '../components/ReturnTestModal';
import { ScienceTooltip } from '../components/ScienceTooltip';
import { useFitDecay } from '../lib/DataContext';
import { calculateBaselineDecay, generateDecayCurveData, isBaselineAffected } from '../lib/calculations';
import { daysBetween, formatDate } from '../lib/date';
import { formatDisplayValue, formatNumber } from '../lib/format';
import { personalMultiplierForType } from '../lib/personalization';

function severityColor(pct: number) {
  if (pct <= 5) return 'var(--green)';
  if (pct <= 15) return 'var(--amber)';
  return 'var(--red)';
}

export function DecayDetailPage() {
  const { layoffId } = useParams();
  const { data } = useFitDecay();
  const navigate = useNavigate();
  const [returnOpen, setReturnOpen] = useState(false);
  const profile = data.profile!;
  const layoff = data.layoffs.find((l) => l.id === layoffId) ?? data.layoffs[0];
  if (!layoff) return <p style={{ color: 'var(--text-secondary)' }}>No layoff found.</p>;

  const days = daysBetween(layoff.startDate, layoff.endDate);
  const totalDays = days + 28;

  const results = data.baselines.map((b) => {
    const mult = personalMultiplierForType(b.type, data.baselines, data.returnTests);
    return {
      baseline: b,
      result: calculateBaselineDecay(b, days, profile, layoff, mult),
      curve: generateDecayCurveData(b, profile, layoff, totalDays, mult),
      mult,
    };
  });

  const avg = (type: string) => {
    const items = results.filter((r) => r.baseline.type === type);
    return items.length ? items.reduce((s, r) => s + r.result.percentLost, 0) / items.length : 0;
  };

  const strengthAvg = avg('strength');
  const cardioAvg = avg('cardio');
  const sportAvg = avg('sport');
  const mobilityAvg = avg('mobility');

  // Summary sentence parts
  const parts: string[] = [];
  if (data.baselines.some((b) => b.type === 'strength')) parts.push(`${formatNumber(strengthAvg, 0)}% strength`);
  if (data.baselines.some((b) => b.type === 'cardio')) parts.push(`${formatNumber(cardioAvg, 0)}% cardio performance`);
  if (data.baselines.some((b) => b.type === 'sport')) parts.push(`${formatNumber(sportAvg, 0)}% sport power`);
  if (data.baselines.some((b) => b.type === 'mobility')) parts.push(`${formatNumber(mobilityAvg, 0)}% mobility/control`);
  const layoffWeights = data.weightLogs
    .filter((log) => log.layoffId === layoff.id || (log.date >= layoff.startDate && log.date <= (layoff.endDate ?? new Date().toISOString().slice(0, 10))))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {days}-day {layoff.reason} layoff
        </span>
      </div>

      {/* Header */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 8 }}>Decay Estimate</span>
        <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {days}-day {layoff.reason} layoff
        </h1>
      </div>

      {/* Summary block */}
      <div className="card" style={{
        padding: '18px 22px',
        borderLeft: '3px solid var(--border)',
        borderRadius: '0 10px 10px 0',
        background: 'var(--surface)',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
          "Based on your {days}-day layoff due to {layoff.reason} with {layoff.activityLevel.replace('_', ' ')}, you have likely lost about{' '}
          {parts.map((p, i) => (
            <span key={i}>
              {i > 0 && i < parts.length - 1 ? ', ' : i > 0 ? ', and ' : ''}
              <strong style={{ color: 'var(--text-primary)', fontStyle: 'normal' }}>{p}</strong>
            </span>
          ))}
          . Recovery typically takes {Math.ceil(days * 0.6)}–{Math.ceil(days * 0.8)} days with structured progressive loading."
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate(`/plan/${layoff.id}`)} style={{ padding: '9px 16px' }}>
            Plan my return
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="btn-ghost pressable" onClick={() => setReturnOpen(true)} style={{ padding: '9px 16px' }}>
            Log return test
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-tertiary)' }}>
            {formatDate(layoff.startDate)} → {layoff.endDate ? formatDate(layoff.endDate) : 'today'}
          </div>
        </div>
      </div>

      {layoffWeights.length >= 2 && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <span className="label">Bodyweight during layoff</span>
          <div className="mono" style={{ fontSize: 20, marginTop: 8 }}>
            {formatDisplayValue(layoffWeights[0].weight, layoffWeights[0].unit ?? 'kg', profile.unitSystem).text} → {formatDisplayValue(layoffWeights[layoffWeights.length - 1].weight, layoffWeights[layoffWeights.length - 1].unit ?? 'kg', profile.unitSystem).text}
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
            Weight changes can affect bodyweight reps, running, jumping, and how heavy warmups feel.
          </p>
        </div>
      )}

      {/* Timeline bar */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Timeline</span>
        <div style={{ height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 4,
            background: `linear-gradient(to right, var(--green), var(--amber), var(--red))`,
            width: `${Math.min(100, (days / Math.max(days, 56)) * 100)}%`,
            transition: 'width 600ms ease-out',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>{formatDate(layoff.startDate)}</span>
          <span>{layoff.endDate ? formatDate(layoff.endDate) : 'Today'}</span>
        </div>
      </div>

      {/* Per-baseline charts */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 4 }}>Baseline estimates <ScienceTooltip kind="decay" /></span>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, marginBottom: 20 }}>
          Confidence ranges widen as layoff duration grows because individual response varies.
        </p>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))' }}>
          {results.map(({ baseline, result, curve }) => {
            const affected = isBaselineAffected(baseline, layoff);
            return (
            <div key={baseline.id} style={{
              display: 'flex', gap: 20, flexWrap: 'wrap',
              padding: '22px 24px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}>
              {/* Chart */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>{baseline.type}</span>
                    <h3 className="tight" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {baseline.name}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="label" style={{ display: 'block', marginBottom: 2 }}>{affected ? 'Predicted' : 'Scope'}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {affected ? formatDisplayValue(result.predicted, baseline.unit, profile.unitSystem).text : 'Not affected'}
                    </span>
                  </div>
                </div>
                <DecayAreaChart
                  data={curve}
                  todayIdx={days}
                  width={480}
                  height={180}
                  color="var(--accent)"
                  showConfidence={data.settings.showConfidenceBands}
                  valueFormatter={(value) => formatDisplayValue(value, baseline.unit, profile.unitSystem).text.replace(/\s+(kg|lbs|cm|in|km|mi|m|yd|sec)$/i, '')}
                />
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                {[
                  { label: 'Original', value: formatDisplayValue(baseline.value, baseline.unit, profile.unitSystem).text },
                  { label: 'Lost', value: `${formatNumber(result.percentLost, 0)}%`, color: severityColor(result.percentLost) },
                  { label: 'Range', value: `±${formatNumber(result.confidence, 0)}%`, tooltip: 'confidence' },
                  { label: 'Days off', value: `${days}` },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}>
                    <span className="label" style={{ display: 'block', marginBottom: 5 }}>{stat.label}{stat.tooltip ? <ScienceTooltip kind="confidence" /> : null}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 17, fontWeight: 700,
                      color: stat.color ?? 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* If ongoing: forward projections */}
      {!layoff.endDate && (
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 16 }}>If the layoff continues</span>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {[7, 14, 28].map((extra) => {
              const avgLoss = results.reduce((sum, r) => {
                const mult = r.mult;
                return sum + calculateBaselineDecay(r.baseline, days + extra, profile, layoff, mult).percentLost;
              }, 0) / Math.max(1, results.length);
              return (
                <div key={extra} style={{ padding: '16px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <span className="label" style={{ display: 'block', marginBottom: 8 }}>+{extra / 7} week{extra === 7 ? '' : 's'}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: severityColor(avgLoss), fontVariantNumeric: 'tabular-nums' }}>
                    ~{formatNumber(avgLoss, 0)}%
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>avg loss projected</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA card */}
      <div
        className="card"
        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'background 150ms' }}
        onClick={() => navigate(`/plan/${layoff.id}`)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Generate re-entry plan</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            A structured 3-week plan to safely return to baseline.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button className="btn-primary" onClick={(e) => { e.stopPropagation(); navigate(`/plan/${layoff.id}`); }}>
            Build plan
          </button>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="var(--text-tertiary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <ReturnTestModal layoff={layoff} open={returnOpen} onClose={() => setReturnOpen(false)} />
    </div>
  );
}
