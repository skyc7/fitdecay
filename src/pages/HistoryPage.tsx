import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useFitDecay } from '../lib/DataContext';
import { calculateBaselineDecay } from '../lib/calculations';
import { daysBetween, formatDate } from '../lib/date';
import { formatDisplayValue, formatNumber } from '../lib/format';
import { exportJson } from '../lib/storage';
import { personalMultiplierForType } from '../lib/personalization';

function severityColor(pct: number) {
  if (pct <= 5) return 'var(--green)';
  if (pct <= 15) return 'var(--amber)';
  return 'var(--red)';
}

function PersonalSignalBar({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  const absVal = Math.abs(value);
  const barWidth = Math.min(absVal * 4, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 60, flexShrink: 0, textTransform: 'capitalize' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'visible', position: 'relative' }}>
        {/* Center line */}
        <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 10, background: 'var(--border)', zIndex: 1 }} />
        {/* Bar */}
        <div style={{
          position: 'absolute',
          top: 0, height: '100%',
          borderRadius: 3,
          background: isPositive ? 'var(--green)' : 'var(--red)',
          width: `${barWidth / 2}%`,
          left: isPositive ? '50%' : `${50 - barWidth / 2}%`,
          transition: 'width 600ms ease-out',
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, fontWeight: 700,
        color: isPositive ? 'var(--green)' : 'var(--red)',
        width: 48, textAlign: 'right', flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {isPositive ? '+' : ''}{formatNumber(value, 0)}%
      </span>
    </div>
  );
}

export function HistoryPage() {
  const { data } = useFitDecay();
  const navigate = useNavigate();
  const profile = data.profile!;
  const [journalLayoffId, setJournalLayoffId] = useState<string | null>(null);
  const [journalQuery, setJournalQuery] = useState('');

  const multiplierData = (['strength', 'cardio', 'sport', 'mobility'] as const).map((type) => {
    const mult = personalMultiplierForType(type, data.baselines, data.returnTests);
    return { type, value: Number(((mult - 1) * 100).toFixed(1)) };
  }).filter((m) => data.baselines.some((b) => b.type === m.type));

  const sortedLayoffs = [...data.layoffs].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 8 }}>History</span>
          <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Layoffs & return tests
          </h1>
        </div>
        {data.layoffs.length > 0 && (
          <button
            className="btn-ghost"
            onClick={() => exportJson(data)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v7M4 7l2.5 2.5L9 7M2 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export JSON
          </button>
        )}
      </div>

      {/* Personal decay signal */}
      {multiplierData.length > 0 && (
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 6 }}>Personal decay signal</span>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Positive values mean you came back above model prediction. Negative means the layoff hit harder than predicted.
          </p>
          <div style={{
            padding: '20px 24px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {multiplierData.map((m) => (
              <PersonalSignalBar key={m.type} label={m.type} value={m.value} />
            ))}
            {multiplierData.every((m) => m.value === 0) && (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                Log return tests after layoffs to build your personal decay profile.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 16 }}>Timeline</span>

        {sortedLayoffs.length === 0 && (
          <div style={{ padding: '32px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16 }}>You're on track. Log a layoff if life gets in the way.</p>
            <button className="btn-primary" onClick={() => navigate('/log')}>Log your first layoff</button>
          </div>
        )}

        {/* Vertical timeline */}
        <div style={{ position: 'relative' }}>
          {sortedLayoffs.length > 1 && (
            <div style={{
              position: 'absolute',
              left: 17, top: 20, bottom: 20,
              width: 1,
              background: 'var(--border)',
              zIndex: 0,
            }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sortedLayoffs.map((layoff, idx) => {
              const days = daysBetween(layoff.startDate, layoff.endDate);
              const isOngoing = !layoff.endDate;
              const returnTests = data.returnTests.filter((t) => t.layoffId === layoff.id);
              const decayEstimates = data.baselines.slice(0, 3).map((b) => {
                const mult = personalMultiplierForType(b.type, data.baselines, data.returnTests);
                const result = calculateBaselineDecay(b, days, profile, layoff, mult);
                return { baseline: b, result };
              });
              const avgLoss = decayEstimates.length > 0
                ? decayEstimates.reduce((s, e) => s + e.result.percentLost, 0) / decayEstimates.length
                : 0;

              return (
                <div key={layoff.id} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                  {/* Timeline dot */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: isOngoing ? 'var(--red-dim)' : 'var(--surface)',
                      border: `1px solid ${isOngoing ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isOngoing ? (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5" stroke="var(--text-tertiary)" strokeWidth="1.2" />
                          <path d="M6.5 3.5V6.5L8.5 8" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    style={{
                      flex: 1,
                      padding: '18px 20px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'background 150ms',
                    }}
                    onClick={() => navigate(`/layoffs/${layoff.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h3 className="tight" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
                            {layoff.reason} layoff
                          </h3>
                          {isOngoing && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--red-dim)', color: 'var(--red)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              Ongoing
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                          {formatDate(layoff.startDate)} → {layoff.endDate ? formatDate(layoff.endDate) : 'today'} · {days} days · {layoff.activityLevel.replace('_', ' ')}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: severityColor(avgLoss), fontVariantNumeric: 'tabular-nums' }}>
                          −{formatNumber(avgLoss, 0)}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>avg loss</div>
                      </div>
                    </div>

                    {/* Decay estimates row */}
                    {decayEstimates.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        {decayEstimates.map(({ baseline, result }) => (
                          <div key={baseline.id} style={{
                            padding: '8px 12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 7,
                            minWidth: 110,
                          }}>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{baseline.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                {formatDisplayValue(result.predicted, baseline.unit, profile.unitSystem).text}
                              </span>
                              <span style={{ fontSize: 11, color: severityColor(result.percentLost), marginLeft: 2 }}>
                                −{formatNumber(result.percentLost, 0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Return tests */}
                    {returnTests.length > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                        <span className="label" style={{ display: 'block', marginBottom: 8 }}>Return tests</span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {returnTests.map((test) => {
                            const baseline = data.baselines.find((b) => b.id === test.baselineId);
                            const diff = test.actualValue - test.predictedValue;
                            const isAbove = diff >= 0;
                            return (
                              <div key={test.id} style={{
                                padding: '8px 12px',
                                background: isAbove ? 'var(--green-dim)' : 'var(--red-dim)',
                                border: `1px solid ${isAbove ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                                borderRadius: 7,
                              }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                                  {baseline?.name ?? 'Return test'}
                                </div>
                                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: isAbove ? 'var(--green)' : 'var(--red)' }}>
                                  {isAbove ? '+' : ''}{formatNumber(diff, 0)} vs predicted
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Footer actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button
                        className="btn-ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/layoffs/${layoff.id}`); }}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        View detail
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/plan/${layoff.id}`); }}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        View plan
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={(e) => { e.stopPropagation(); setJournalLayoffId(layoff.id); }}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        View journal
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      {sortedLayoffs.length > 0 && (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {[
            { label: 'Total layoffs', value: `${data.layoffs.length}` },
            {
              label: 'Total days off',
              value: `${data.layoffs.reduce((s, l) => s + daysBetween(l.startDate, l.endDate), 0)}`,
            },
            { label: 'Return tests', value: `${data.returnTests.length}` },
            { label: 'Baselines tracked', value: `${data.baselines.length}` },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '16px 18px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}>
              <span className="label" style={{ display: 'block', marginBottom: 6 }}>{stat.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {journalLayoffId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 280, background: 'rgba(0,0,0,.58)', display: 'grid', placeItems: 'end center', padding: 16 }} onMouseDown={(e) => e.target === e.currentTarget && setJournalLayoffId(null)}>
          <section className="mobile-sheet card" style={{ width: 'min(640px, 100%)', maxHeight: '86vh', overflow: 'auto', padding: 22 }}>
            <span className="label">Layoff journal</span>
            <h2 className="tight" style={{ margin: '8px 0 14px' }}>Notes worth re-reading</h2>
            <input className="field" value={journalQuery} onChange={(e) => setJournalQuery(e.target.value)} placeholder="Search notes..." style={{ marginBottom: 14 }} />
            {(() => {
              const notes = data.workoutLogs
                .filter((log) => log.layoffId === journalLayoffId && log.notes?.trim())
                .filter((log) => !journalQuery || `${log.label} ${log.notes}`.toLowerCase().includes(journalQuery.toLowerCase()))
                .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
              if (!notes.length) {
                return <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No notes yet. Tap any session to start journaling.</p>;
              }
              return (
                <>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {notes.map((log) => (
                      <article key={log.id} style={{ padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{log.label}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 11, margin: '4px 0 8px' }}>{formatDate(log.completedAt)} · felt {log.felt}/5</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{log.notes}</p>
                      </article>
                    ))}
                  </div>
                  <button className="btn-ghost pressable" style={{ marginTop: 14 }} onClick={() => {
                    const text = notes.map((log) => `${formatDate(log.completedAt)} — ${log.label} (felt ${log.felt}/5)\n${log.notes}`).join('\n\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'fitdecay-journal.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>Export journal</button>
                </>
              );
            })()}
          </section>
        </div>
      )}
    </div>
  );
}
