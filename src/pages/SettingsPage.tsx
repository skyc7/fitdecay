import { toast } from "sonner";
import { useFitDecay } from "../lib/DataContext";
import { exportJson } from "../lib/storage";
import type { UnitSystem } from "../types";

export function SettingsPage() {
  const { data, setProfile, updateSettings, reset } = useFitDecay();
  const settings = data.settings;

  function changeUnits(next: UnitSystem) {
    if (!data.profile || data.profile.unitSystem === next) return;
    setProfile({
      ...data.profile,
      unitSystem: next,
    });
    const label = next === "metric" ? "Metric units" : next === "imperial" ? "Imperial units" : "US metric units";
    toast.success(`${label} selected.`);
  }

  function importData(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("fitdecay:v1", String(reader.result));
      toast.success("Data imported. Reloading FitDecay now.");
      setTimeout(() => window.location.reload(), 600);
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: "'Inter', sans-serif" }}>
      <div>
        <span className="label" style={{ display: "block", marginBottom: 8 }}>Preferences</span>
        <h1 className="tight" style={{ fontSize: 30, margin: 0 }}>Settings</h1>
        <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Small controls, big calm. FitDecay stays local on this device.</p>
      </div>

      <section className="card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <SettingRow title="Show uncertainty bands" subtitle="Adds confidence shading around decay curves.">
          <input type="checkbox" checked={settings.showConfidenceBands} onChange={(e) => updateSettings({ showConfidenceBands: e.target.checked })} />
        </SettingRow>
        <SettingRow title="UI sounds" subtitle="Off by default. Completion chimes stay subtle.">
          <input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
        </SettingRow>
        <SettingRow title="Theme" subtitle="Light mode is available, but the product is tuned for dark.">
          <select className="field" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })} style={{ maxWidth: 180 }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </SettingRow>
        <SettingRow title="Units" subtitle="Controls how values are shown. Your original entries stay unchanged.">
          <select className="field" value={data.profile?.unitSystem ?? "metric"} onChange={(e) => changeUnits(e.target.value as UnitSystem)} style={{ maxWidth: 180 }}>
            <option value="metric">Metric: kg, cm, km</option>
            <option value="imperial">Imperial: lbs, in, mi</option>
            <option value="us">US metric: lbs, in, mi</option>
          </select>
        </SettingRow>
        <SettingRow title="Beginner mode" subtitle="Keeps the dashboard calmer and hides advanced charts until you ask for them.">
          <input type="checkbox" checked={settings.beginnerMode} onChange={(e) => updateSettings({ beginnerMode: e.target.checked })} />
        </SettingRow>
      </section>

      <section className="card" style={{ padding: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn-primary pressable" onClick={() => exportJson(data)}>Export data</button>
        <label className="btn-ghost pressable">
          Import data
          <input type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </label>
        <button
          className="btn-ghost pressable"
          onClick={() => {
            if (window.confirm("Reset all FitDecay data on this device?")) {
              reset();
              toast("FitDecay has been reset.");
            }
          }}
        >
          Reset all data
        </button>
      </section>
    </div>
  );
}

function SettingRow({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 56 }}>
      <div>
        <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 3 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
