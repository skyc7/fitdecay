# FitDecay

**FitDecay** predicts how much fitness you lose during a training break and tells you exactly where to start when you return — so your first week back doesn't wreck you.

Live app: https://fitdecay.vercel.app

![FitDecay Dashboard](public/screenshots/dashboard.png)

---

## The Problem

Most people return from a break and jump back to where they left off. The result is predictable: excessive soreness, injury risk, and discouragement. The science on deconditioning is well-established, but it isn't accessible in a usable tool. FitDecay closes that gap.

---

## Decay Models

FitDecay applies separate exponential decay curves per fitness type, because strength and cardiovascular endurance deconditioning operate on different timescales and mechanisms.

### General Decay Formula

For each baseline metric, the predicted retained capacity after `d` days off is:

```
retention(d) = 1 - decay_rate × (1 - e^(-λ × d))
```

where:
- `decay_rate` — the maximum possible loss for this fitness type (asymptote)
- `λ` — the decay speed constant (higher = faster decay)
- `d` — days elapsed since the layoff started

### Per-Type Constants

| Type | Max Loss | Speed (λ) | Notes |
|------|----------|-----------|-------|
| Strength | ~25% | slow | Neural adaptations persist; muscle cross-section declines ~0.5–1%/week |
| Cardiovascular | ~50% | fast | VO₂ max proxies drop within days; plasma volume falls first |
| Power / Sport | ~35% | medium | Mix of neural (durable) and metabolic (fragile) components |
| Mobility | ~20% | slow | Tissue adaptations persist longer than metabolic fitness |

### Activity Level Multiplier

Complete rest decays faster than light activity. FitDecay applies a multiplier `m ∈ [0.4, 1.0]` to `decay_rate`:

| Activity During Break | Multiplier |
|----------------------|-----------|
| Complete rest | 1.0 |
| Light activity | 0.6 |
| Cross-training | 0.4 |

So the full model is:

```
retention(d) = 1 - (m × decay_rate) × (1 - e^(-λ × d))
```

### Personal Calibration

After the first session back, you log a **return test** — your actual performance on each metric. FitDecay computes a **personal multiplier**:

```
personal_multiplier = actual_retention / predicted_retention
```

This multiplier adjusts all future predictions for your profile, because individual deconditioning rates vary significantly with training age, age, and genetics.

---

## Re-Entry Targets

The re-entry plan computes a **safe first-session target** for each baseline:

```
target = baseline × retention(d) × safety_factor
```

where `safety_factor = 0.9` provides a 10% buffer below the model prediction. Starting conservative on day one avoids the DOMS spike that discourages return.

---

## Features

- **Decay modeling** — separate curves for strength, cardio, power, and mobility
- **Personal baselines** — track PRs across 8 exercise categories; FitDecay anchors predictions to your numbers
- **Re-Entry Plan** — generates a first-session target for every tracked benchmark
- **Evidence log** — record return tests; the model calibrates to your actual results
- **Activity-level modifiers** — rest vs. light activity vs. cross-training adjusts the decay rate
- **Layoff history** — track multiple breaks over time

![Baselines](public/screenshots/baselines.png)

![Re-Entry Plan](public/screenshots/plan.png)

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Recharts (decay curves and history charts)
- Framer Motion
- localStorage persistence (no backend required)

---

## Run Locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, then click **Load demo data** to explore with sample data.

---

## Science References

The decay constants are derived from the peer-reviewed deconditioning literature:

- Mujika & Padilla (2000) — "Detraining: Loss of Training-Induced Physiological and Performance Adaptations" (*Sports Medicine*)
- Coyle et al. (1984) — cardiovascular detraining timecourse
- Häkkinen & Komi (1985) — strength retention during reduced training

The full citation list is in the **About the Science** page inside the app.
