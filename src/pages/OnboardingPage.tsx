import { useState } from 'react';
import { useFitDecay } from '../lib/DataContext';
import { todayIso } from '../lib/date';
import type { Baseline, UserProfile } from '../types';
import { BaselineForm } from '../components/BaselineForm';

const GOALS = [
  'Mostly lifting',
  'Mostly running or cardio',
  'A mix of strength and cardio',
  'Sport, yoga, Pilates, or general fitness',
];

type Step = 'welcome' | 'profile' | 'goal' | 'baselines' | 'done';
const STEPS: Step[] = ['welcome', 'profile', 'goal', 'baselines', 'done'];

export function OnboardingPage() {
  const { setProfile, addBaseline, loadDemo } = useFitDecay();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [age, setAge] = useState('28');
  const [sex, setSex] = useState('other');
  const [trainingAge, setTrainingAge] = useState('3');
  const [weight, setWeight] = useState('75');
  const [height, setHeight] = useState('178');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [goal, setGoal] = useState('');
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [error, setError] = useState('');

  const stepIdx = STEPS.indexOf(step);
  const progress = (stepIdx / (STEPS.length - 1)) * 100;

  function goNext() {
    setError('');
    if (step === 'profile') {
      if (!name.trim()) return setError('Your name is required.');
      const a = Number(age), ta = Number(trainingAge), w = Number(weight), h = Number(height);
      if (![a, ta, w, h].every((v) => Number.isFinite(v) && v > 0))
        return setError('Age, training age, weight, and height must be positive numbers.');
    }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function finish() {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Athlete',
      age: Number(age) || 28,
      sex: sex as UserProfile['sex'],
      trainingAge: Number(trainingAge) || 3,
      weight: Number(weight) || 75,
      height: Number(height) || (unitSystem === 'metric' ? 178 : 70),
      unitSystem: unitSystem as UserProfile['unitSystem'],
      createdAt: todayIso(),
    };
    setProfile(profile);
    baselines.forEach(addBaseline);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 18px',
    fontSize: 15,
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 150ms',
    boxSizing: 'border-box',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '32px 24px',
      position: 'relative',
    }}>
      <style>{`
        input::placeholder { color: var(--text-tertiary); }
        input:focus, select:focus { border-color: rgba(197,255,61,0.4) !important; }
        .goal-opt:hover { border-color: rgba(197,255,61,0.3) !important; background: var(--card-hover) !important; }
      `}</style>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          background: 'var(--accent)',
          width: `${progress}%`,
          transition: 'width 300ms ease-out',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Logo top-left */}
      <div style={{ position: 'absolute', top: 24, left: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22,
          background: 'var(--accent)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 8.5L3.5 3.5L6 6L8 1.5" stroke="#0A0A0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          FitDecay
        </span>
      </div>

      {/* Step content */}
      <div
        key={step}
        style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeUp 250ms ease-out' }}
      >
        {step === 'welcome' && (
          <>
            <span className="label" style={{ display: 'block', marginBottom: 12 }}>Fitness tracking</span>
            <h1 className="tight" style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px', lineHeight: 1.1 }}>
              Know exactly where<br />your fitness stands.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 40px', lineHeight: 1.6 }}>
              FitDecay helps you restart training after time off. Tell it what you used to do, log the break, and it gives you a calmer first week back.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={goNext} style={{ padding: '12px 24px', fontSize: 14 }}>
                Get started
              </button>
              <button
                className="btn-ghost"
                onClick={loadDemo}
                style={{ padding: '12px 20px', fontSize: 14 }}
              >
                Load demo data
              </button>
            </div>
          </>
        )}

        {step === 'profile' && (
          <>
            <span className="label" style={{ display: 'block', marginBottom: 12 }}>Step 1 of 3</span>
            <h2 className="tight" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Tell us about yourself.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 28px' }}>
              Just enough to make the recommendations feel like they belong to you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                style={inputStyle}
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goNext()}
                autoFocus
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input style={inputStyle} placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <input style={inputStyle} placeholder="Years training" value={trainingAge} onChange={(e) => setTrainingAge(e.target.value)} />
                <input style={inputStyle} placeholder={`Weight (${unitSystem === 'metric' ? 'kg' : 'lbs'})`} value={weight} onChange={(e) => setWeight(e.target.value)} />
                <input style={inputStyle} placeholder={`Height (${unitSystem === 'metric' ? 'cm' : 'in'})`} value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
              >
                <option value="metric">Metric (kg, cm, km)</option>
                <option value="imperial">Imperial (lbs, inches, miles)</option>
                <option value="us">US metric (lbs, inches, miles)</option>
              </select>
            </div>
            {error && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--red)' }}>{error}</p>}
            <div style={{ marginTop: 24 }}>
              <button className="btn-primary" onClick={goNext} style={{ padding: '12px 24px', fontSize: 14 }}>Continue</button>
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <span className="label" style={{ display: 'block', marginBottom: 12 }}>Step 2 of 3</span>
            <h2 className="tight" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              What do you primarily train?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 28px' }}>
              Pick the closest match. You can change your benchmarks later.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map((g) => (
                <div
                  key={g}
                  className="goal-opt"
                  onClick={() => { setGoal(g); setTimeout(goNext, 150); }}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    border: `1px solid ${goal === g ? 'rgba(197,255,61,0.4)' : 'var(--border)'}`,
                    background: goal === g ? 'var(--card-hover)' : 'var(--card)',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: goal === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 150ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  {g}
                  {goal === g && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button onClick={goNext} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                Skip this step
              </button>
            </div>
          </>
        )}

        {step === 'baselines' && (
          <>
            <span className="label" style={{ display: 'block', marginBottom: 12 }}>Step 3 of 3</span>
            <h2 className="tight" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Add one thing you know.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 24px', lineHeight: 1.5 }}>
              A lift, run, machine, hold, or movement is enough. You can skip this and add it later.
            </p>
            <BaselineForm onSave={(b) => setBaselines((prev) => [b, ...prev])} />
            {baselines.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {baselines.map((b) => (
                  <div key={b.id} style={{
                    padding: '10px 14px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{b.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                      {b.value} {b.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-primary" onClick={goNext} style={{ padding: '12px 24px', fontSize: 14 }}>
                {baselines.length > 0 ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48,
                background: 'var(--accent-dim)',
                border: '1px solid rgba(197,255,61,0.2)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11L9 16L18 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h2 className="tight" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              You're set up, {name || 'Athlete'}.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 36px', lineHeight: 1.6 }}>
              {baselines.length > 0
                ? `${baselines.length} baseline${baselines.length > 1 ? 's' : ''} logged. Decay models calibrated. Log a layoff any time you need a break.`
                : 'Profile saved. Add baselines any time from the Baselines page to activate decay projections.'}
            </p>
            <button className="btn-primary" onClick={finish} style={{ alignSelf: 'flex-start', padding: '12px 24px', fontSize: 14 }}>
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </main>
  );
}
