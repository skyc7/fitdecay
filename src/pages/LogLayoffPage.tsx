import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitDecay } from '../lib/DataContext';
import { calculateBaselineDecay } from '../lib/calculations';
import { daysBetween, todayIso } from '../lib/date';
import { formatDisplayValue, formatNumber, summarizeDecay } from '../lib/format';
import { personalMultiplierForType } from '../lib/personalization';
import type { Layoff } from '../types';

const REASONS: Array<{ value: Layoff['reason']; label: string; icon: React.ReactNode }> = [
  {
    value: 'illness',
    label: 'Illness',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'injury',
    label: 'Injury',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'busy',
    label: 'Busy life',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    value: 'vacation',
    label: 'Vacation',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'other',
    label: 'Other',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="8" r="1" fill="currentColor" />
        <circle cx="8" cy="8" r="1" fill="currentColor" />
        <circle cx="11" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

const ACTIVITY_LEVELS: Array<{ value: Layoff['activityLevel']; label: string; sublabel: string }> = [
  { value: 'complete_rest',     label: 'Complete rest',     sublabel: 'Bedridden or no movement' },
  { value: 'light_activity',    label: 'Light activity',    sublabel: 'Walking and daily life' },
  { value: 'reduced_training',  label: 'Reduced training',  sublabel: '30–50% normal volume' },
];

function severityColor(pct: number) {
  if (pct <= 5) return 'var(--green)';
  if (pct <= 15) return 'var(--amber)';
  return 'var(--red)';
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: "'Inter', sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 150ms',
};

export function LogLayoffPage() {
  const { data, addLayoff } = useFitDecay();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Layoff>({
    id: crypto.randomUUID(),
    startDate: todayIso(),
    endDate: null,
    reason: 'busy',
    reasonDetails: '',
    activityLevel: 'light_activity',
    affectedTypes: undefined,
    affectedBaselineIds: undefined,
  });
  const [scopeMode, setScopeMode] = useState<'all' | 'types' | 'baselines'>('all');
  const [error, setError] = useState('');
  const profile = data.profile!;
  const days = daysBetween(draft.startDate, draft.endDate);

  const preview = useMemo(
    () =>
      data.baselines.map((baseline) => ({
        baseline,
        result: calculateBaselineDecay(baseline, days, profile, draft, personalMultiplierForType(baseline.type, data.baselines, data.returnTests)),
      })),
    [data.baselines, data.returnTests, days, draft, profile]
  );

  function save() {
    if (!draft.startDate) return setError('Choose a start date.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('End date cannot be before start date.');
    addLayoff({ ...draft, endDate: draft.endDate || null });
    navigate(`/layoffs/${draft.id}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input:focus, select:focus, textarea:focus { border-color: rgba(197,255,61,0.4) !important; }
      `}</style>

      {/* Header */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 8 }}>Log layoff</span>
        <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Tell FitDecay what changed.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
          Decay projections update in real time as you fill in the details.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr', alignItems: 'start' }}>

        {/* Form card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Date range */}
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h2 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>Dates</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Start date
                </label>
                <input
                  style={inputStyle}
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  End date
                </label>
                <input
                  style={inputStyle}
                  type="date"
                  value={draft.endDate ?? ''}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value || null })}
                  placeholder="Leave blank if ongoing"
                />
              </div>
            </div>
            {days > 0 && (
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-tertiary)' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontWeight: 700 }}>{days}</span> days
                {!draft.endDate && ' so far'}
              </p>
            )}
          </div>

          {/* Reason */}
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h2 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>Reason</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setDraft({ ...draft, reason: r.value })}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 7,
                    border: `1px solid ${draft.reason === r.value ? 'rgba(197,255,61,0.35)' : 'var(--border)'}`,
                    background: draft.reason === r.value ? 'var(--accent-dim)' : 'var(--surface)',
                    color: draft.reason === r.value ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 150ms',
                  }}
                >
                  <span style={{ color: draft.reason === r.value ? 'var(--accent)' : 'var(--text-tertiary)' }}>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
            {draft.reason === 'injury' && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--amber-dim)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 7 }}>
                <p style={{ fontSize: 12, color: 'var(--amber)', margin: 0 }}>
                  Injury modifier applied — decay rates slightly elevated. Consult a professional before returning.
                </p>
              </div>
            )}
          </div>

          {/* Activity level */}
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h2 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>Activity level during break</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY_LEVELS.map((al) => (
                <div
                  key={al.value}
                  onClick={() => setDraft({ ...draft, activityLevel: al.value })}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 7,
                    border: `1px solid ${draft.activityLevel === al.value ? 'rgba(197,255,61,0.35)' : 'var(--border)'}`,
                    background: draft.activityLevel === al.value ? 'var(--accent-dim)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 150ms',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: draft.activityLevel === al.value ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {al.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{al.sublabel}</div>
                  </div>
                  {draft.activityLevel === al.value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Affected scope */}
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h2 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>What was affected?</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 12, margin: '0 0 14px' }}>A sprained ankle does not have to decay your bench estimate.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                ['all', 'Everything'],
                ['types', 'By category'],
                ['baselines', 'Specific baselines'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className="pressable"
                  onClick={() => {
                    const next = value as typeof scopeMode;
                    setScopeMode(next);
                    setDraft({
                      ...draft,
                      affectedTypes: next === 'types' ? [] : undefined,
                      affectedBaselineIds: next === 'baselines' ? [] : undefined,
                    });
                  }}
                  style={{ minHeight: 44, padding: '8px 14px', borderRadius: 7, border: `1px solid ${scopeMode === value ? 'rgba(197,255,61,0.35)' : 'var(--border)'}`, background: scopeMode === value ? 'var(--accent-dim)' : 'var(--surface)', color: scopeMode === value ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  {label}
                </button>
              ))}
            </div>
            {scopeMode === 'types' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['strength', 'cardio', 'sport', 'mobility'] as const).map((type) => {
                  const active = draft.affectedTypes?.includes(type);
                  return (
                    <button
                      className="pressable"
                      key={type}
                      onClick={() => {
                        const current = draft.affectedTypes ?? [];
                        setDraft({ ...draft, affectedTypes: active ? current.filter((item) => item !== type) : [...current, type] });
                      }}
                      style={{ minHeight: 44, padding: '8px 12px', borderRadius: 7, border: `1px solid ${active ? 'rgba(197,255,61,0.35)' : 'var(--border)'}`, background: active ? 'var(--accent-dim)' : 'var(--surface)', color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            )}
            {scopeMode === 'baselines' && (
              <div style={{ display: 'grid', gap: 8 }}>
                {data.baselines.map((baseline) => {
                  const active = draft.affectedBaselineIds?.includes(baseline.id);
                  return (
                    <button
                      className="pressable"
                      key={baseline.id}
                      onClick={() => {
                        const current = draft.affectedBaselineIds ?? [];
                        setDraft({ ...draft, affectedBaselineIds: active ? current.filter((item) => item !== baseline.id) : [...current, baseline.id] });
                      }}
                      style={{ minHeight: 44, textAlign: 'left', padding: '10px 12px', borderRadius: 7, border: `1px solid ${active ? 'rgba(197,255,61,0.35)' : 'var(--border)'}`, background: active ? 'var(--accent-dim)' : 'var(--surface)', color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      {baseline.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <h2 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Notes (optional)</h2>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              value={draft.reasonDetails}
              onChange={(e) => setDraft({ ...draft, reasonDetails: e.target.value })}
              placeholder="Fever for 3 days, travel, finals week, ankle sprain..."
            />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>}

          <button className="btn-primary" onClick={save} style={{ alignSelf: 'flex-start', padding: '12px 24px', fontSize: 14 }}>
            Save and view estimate
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Live preview */}
        {preview.length > 0 && days > 0 && (
          <div>
            <span className="label" style={{ display: 'block', marginBottom: 12 }}>Live preview — {days} day{days !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preview.map(({ baseline, result }) => (
                <div key={baseline.id} style={{
                  padding: '14px 16px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{baseline.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{summarizeDecay(baseline, result)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDisplayValue(result.predicted, baseline.unit, data.profile!.unitSystem).text}
                    </div>
                    <div style={{ fontSize: 12, color: severityColor(result.percentLost), fontFamily: "'JetBrains Mono', monospace" }}>
                      −{formatNumber(result.percentLost, 0)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.baselines.length === 0 && (
          <div style={{ padding: '20px 22px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              Add a baseline when you can. Until then, this layoff is saved and ready for estimates later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
