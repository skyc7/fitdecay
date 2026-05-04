const evidence = [
  {
    label: "VO2 max detraining",
    takeaway: "Aerobic capacity is one of the fastest qualities to decline when the training stimulus is removed or sharply reduced.",
    modelUse: "FitDecay applies the steepest early decay curve to cardio benchmarks, with time-trial performance changing less than the underlying VO2 estimate.",
    source: "Systematic review and meta-analysis on maximal oxygen uptake after training cessation",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9398774/",
  },
  {
    label: "Endurance performance",
    takeaway: "Endurance capacity can fall even when maximal oxygen uptake is partly maintained, especially when normal training volume is replaced by minimal training.",
    modelUse: "The app treats race and row times as performance outputs, not direct VO2 max measurements, and uses a performance multiplier.",
    source: "Madsen et al., Journal of Applied Physiology, 4 weeks detraining in endurance athletes",
    href: "https://pubmed.ncbi.nlm.nih.gov/8282588/",
  },
  {
    label: "Strength retention",
    takeaway: "Strength adaptations usually regress more slowly than aerobic adaptations, and some strength gains can remain after weeks away from resistance training.",
    modelUse: "Strength, machine, dumbbell, and calisthenics baselines get a slower early decay curve than cardio.",
    source: "Resistance training and detraining study in postmenopausal women",
    href: "https://pubmed.ncbi.nlm.nih.gov/12351331/",
  },
  {
    label: "Power and field fitness",
    takeaway: "Short detraining periods can affect cardiorespiratory, maximal strength, and explosive strength outcomes differently.",
    modelUse: "Jump and sprint metrics sit between strength and cardio because they mix force, speed, coordination, and tissue readiness.",
    source: "Four-week detraining study in army soldiers",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11280788/",
  },
  {
    label: "Flexibility and mobility",
    takeaway: "Range-of-motion gains from stretching training appear partly retained after detraining, but they still regress with time away.",
    modelUse: "Yoga, Pilates, balance, hold, and mobility baselines use a slower skill-and-ROM decay curve.",
    source: "Systematic review and meta-analysis on stretching detraining and range of motion",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12638565/",
  },
  {
    label: "Yoga-specific detraining",
    takeaway: "Yoga training can improve physical performance measures, but training effects may not fully last after a longer break.",
    modelUse: "FitDecay warns that yoga and Pilates estimates are lower-confidence and should be anchored by repeat tests.",
    source: "Effects of yoga training and detraining on physical performance",
    href: "https://www.ijpp.com/IJPP%20archives/2014_58_1_Jan%20-%20Mar/61-68.pdf",
  },
];

export function AboutSciencePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: "'Inter', sans-serif" }}>
      <div>
        <span className="label" style={{ display: "block", marginBottom: 8 }}>Evidence base</span>
        <h1 className="tight" style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Why these estimates are not made up
        </h1>
        <p style={{ maxWidth: 760, margin: "12px 0 0", color: "var(--text-tertiary)", fontSize: 14, lineHeight: 1.7 }}>
          FitDecay uses broad detraining patterns from exercise physiology, then adjusts them by layoff length, age, training history,
          activity level, reason for layoff, and your own return-test history. It is still an estimate, but the direction of the model
          follows documented trends: endurance drops quickly, strength is retained longer, power sits in the middle, and mobility or
          skill-based work often decays more gradually.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {evidence.map((item) => (
          <article className="card" style={{ padding: 20 }} key={item.label}>
            <span className="label">{item.label}</span>
            <h2 className="tight" style={{ margin: "10px 0 8px", fontSize: 18, color: "var(--text-primary)" }}>
              {item.takeaway}
            </h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.65 }}>{item.modelUse}</p>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", marginTop: 16, color: "var(--accent)", fontSize: 13, textDecoration: "none" }}
            >
              {item.source}
            </a>
          </article>
        ))}
      </div>

      <div className="card" style={{ padding: 20, borderColor: "rgba(251,191,36,0.24)", background: "var(--amber-dim)" }}>
        <h2 className="tight" style={{ margin: "0 0 8px", color: "var(--amber)", fontSize: 18 }}>Important limits</h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
          Research rarely matches one person perfectly. Machine settings, rep standards, yoga poses, Pilates spring tension, sleep,
          illness severity, pain, and stress all change the result. Treat the estimate as a conservative planning tool, not medical
          advice. After injury or significant illness, get professional clearance before returning to hard training.
        </p>
      </div>

      <section className="card" style={{ padding: 20 }}>
        <span className="label">Model formulas</span>
        <h2 className="tight" style={{ margin: "8px 0 12px", fontSize: 20 }}>The simple version</h2>
        <pre className="mono" style={{ whiteSpace: "pre-wrap", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7 }}>
{`daysOff = layoffEnd - layoffStart
baseLoss = curveFor(qualityType, daysOff)

profileModifier =
  trainingAge >= 5 ? 0.8 : 1
  × ageModifierAfter35
  × activityLevelModifier
  × reasonModifier

personalMultiplier =
  weightedAverage(actualLoss / predictedLoss)

percentLost = baseLoss × profileModifier × personalMultiplier
predictedValue = baselineValue × (1 - percentLost)
confidenceBand = predictedValue ± (predictedValue × confidence%)`}
        </pre>
        <p style={{ color: "var(--text-tertiary)", fontSize: 13, lineHeight: 1.7 }}>
          Time-based metrics such as 5K, sprint, and shuttle tests invert the direction: higher time is worse, so the same percent loss
          increases the predicted time. Machine and rep-max entries use the same strength curve but preserve the rep context, such as 10RM.
        </p>
      </section>
    </div>
  );
}
