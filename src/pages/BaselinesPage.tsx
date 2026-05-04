import { useState } from 'react';
import { toast } from 'sonner';
import { BaselineForm } from '../components/BaselineForm';
import { useFitDecay } from '../lib/DataContext';
import { formatDisplayValue, parseDisplayInput } from '../lib/format';
import type { Baseline } from '../types';

const TYPE_LABELS: Record<string, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  sport: 'Sport',
  mobility: 'Yoga / Pilates / Mobility',
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  strength: { bg: 'rgba(197,255,61,0.1)',   color: 'var(--accent)' },
  cardio:   { bg: 'rgba(74,222,128,0.1)',    color: 'var(--green)' },
  sport:    { bg: 'rgba(251,191,36,0.1)',    color: 'var(--amber)' },
  mobility: { bg: 'rgba(217,70,239,0.1)',    color: '#e879f9' },
};

function splitDisplayValue(value: number, unit: string, unitSystem: 'metric' | 'imperial' | 'us') {
  const display = formatDisplayValue(value, unit, unitSystem);
  if (display.text.endsWith(' min')) return { value: display.text.replace(' min', ''), unit: 'min' };
  return { value: String(display.value), unit: display.unit };
}

function EditableCell({
  value,
  onSave,
  type = 'text',
  style,
}: {
  value: string | number;
  onSave: (v: string) => void;
  type?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    setEditing(false);
    if (draft !== String(value)) onSave(draft);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(String(value)); } }}
        style={{
          background: 'var(--surface)',
          border: '1px solid rgba(197,255,61,0.4)',
          borderRadius: 5,
          padding: '4px 8px',
          fontSize: 13,
          color: 'var(--text-primary)',
          outline: 'none',
          fontFamily: "'Inter', sans-serif",
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
      />
    );
  }

  return (
    <span
      onClick={() => { setEditing(true); setDraft(String(value)); }}
      title="Click to edit"
      style={{
        cursor: 'text',
        borderRadius: 4,
        padding: '2px 4px',
        transition: 'background 150ms',
        display: 'inline-block',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {value}
    </span>
  );
}

export function BaselinesPage() {
  const { data, addBaseline, deleteBaseline, updateBaseline } = useFitDecay();
  const [showForm, setShowForm] = useState(false);
  const profile = data.profile!;
  const groups = (['strength', 'cardio', 'sport', 'mobility'] as const).filter(
    (g) => data.baselines.some((b) => b.type === g)
  );
  const allTypes = ['strength', 'cardio', 'sport', 'mobility'] as const;

  function handleSave(b: Baseline) {
    addBaseline(b);
    setShowForm(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 8 }}>Performance anchors</span>
          <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Baselines
          </h1>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm((s) => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {showForm ? 'Cancel' : 'Add baseline'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          padding: '22px 24px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
        }}>
          <h2 className="tight" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            New baseline
          </h2>
          <BaselineForm onSave={handleSave} />
        </div>
      )}

      {/* Empty state */}
      {data.baselines.length === 0 && !showForm && (
        <div style={{ padding: '48px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: 'var(--accent-dim)',
            border: '1px solid rgba(197,255,61,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 16L7 10L11 13L15 6L18 8" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="18" x2="17" y2="18" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="tight" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Nothing to compare against yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 20px' }}>
            Add one current benchmark, machine lift, run, hold, or mobility test to wake up the model.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Add your first baseline</button>
        </div>
      )}

      {/* Grouped tables */}
      {(groups.length > 0 ? groups : allTypes).map((group) => {
        const baselines = data.baselines.filter((b) => b.type === group);
        if (baselines.length === 0) return null;
        const colors = TYPE_COLORS[group];
        return (
          <div key={group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px',
                borderRadius: 4,
                background: colors.bg,
                color: colors.color,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {TYPE_LABELS[group]}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{baselines.length} baseline{baselines.length > 1 ? 's' : ''}</span>
            </div>

            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 70px 90px 100px 1fr auto',
                padding: '10px 18px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 600,
                gap: 12,
              }}>
                <span>Name</span>
                <span>Value</span>
                <span>Unit</span>
                <span>Reps</span>
                <span>Status</span>
                <span>Recorded</span>
                <span />
              </div>

              {/* Rows */}
              {baselines.map((baseline, idx) => {
                const display = splitDisplayValue(baseline.value, baseline.unit, profile.unitSystem);
                return (
                <div
                  key={baseline.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 70px 90px 100px 1fr auto',
                    padding: '13px 18px',
                    borderBottom: idx < baselines.length - 1 ? '1px solid var(--border-subtle, var(--border))' : 'none',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Name — editable */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <EditableCell
                      value={baseline.name}
                      onSave={(v) => updateBaseline({ ...baseline, name: v })}
                    />
                  </span>

                  {/* Value — editable */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    <EditableCell
                      value={display.value}
                      onSave={(v) => {
                        const next = parseDisplayInput(v, baseline.unit, profile.unitSystem);
                        if (Number.isFinite(next) && next > 0) updateBaseline({ ...baseline, value: next });
                      }}
                    />
                  </span>

                  {/* Unit */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {display.unit}
                  </span>

                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {baseline.inputKind === 'rep_max' && baseline.reps ? `${baseline.reps}RM` : baseline.inputKind === 'bodyweight_reps' ? 'max' : '—'}
                  </span>

                  {/* PR status toggle */}
                  <button
                    onClick={() => updateBaseline({ ...baseline, isCurrentPr: !baseline.isCurrentPr })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 5,
                      border: `1px solid ${baseline.isCurrentPr ? 'rgba(197,255,61,0.3)' : 'var(--border)'}`,
                      background: baseline.isCurrentPr ? 'var(--accent-dim)' : 'transparent',
                      color: baseline.isCurrentPr ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      letterSpacing: '0.03em',
                      transition: 'all 150ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {baseline.isCurrentPr ? 'Current PR' : 'Historical'}
                  </button>

                  {/* Date */}
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {baseline.recordedAt ?? '—'}
                  </span>

                  {/* Delete */}
                    <button
                      onClick={() => {
                        deleteBaseline(baseline.id);
                        toast('Baseline deleted.', {
                          description: baseline.name,
                          action: { label: 'Undo', onClick: () => addBaseline(baseline) },
                          duration: 5000,
                        });
                      }}
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = 'var(--red)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3H4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Tip */}
      {data.baselines.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
          Click any name or value to edit inline. Changes save immediately.
        </p>
      )}
    </div>
  );
}
