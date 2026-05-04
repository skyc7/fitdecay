import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
        <section className="card" style={{ maxWidth: 440, padding: 24, textAlign: "center" }}>
          <h1 className="tight" style={{ margin: 0, color: "var(--text-primary)", fontSize: 28 }}>Something broke.</h1>
          <p style={{ color: "var(--text-tertiary)", lineHeight: 1.6 }}>Your data is safe. Reload the app and FitDecay will pick up where you left off.</p>
          <button className="btn-primary pressable" onClick={() => window.location.reload()}>Reload FitDecay</button>
        </section>
      </main>
    );
  }
}
