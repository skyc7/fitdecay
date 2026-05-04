import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFitDecay } from "../lib/DataContext";
import { addDaysIso, todayIso } from "../lib/date";

export function InstallPrompt() {
  const { data, updateSettings } = useFitDecay();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissedUntil = data.settings.dismissedInstallPromptUntil;
    const dismissed = dismissedUntil && dismissedUntil >= todayIso();
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
    setShow(Boolean(data.settings.visitCount >= 2 && !dismissed && !standalone));
  }, [data.settings.dismissedInstallPromptUntil, data.settings.visitCount]);

  function dismiss() {
    updateSettings({ dismissedInstallPromptUntil: addDaysIso(todayIso(), 14) });
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 76,
            zIndex: 200,
            maxWidth: 520,
            margin: "0 auto",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <motion.div
              animate={{ rotate: [0, -4, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, repeatDelay: 1.4 }}
              style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent)", display: "grid", placeItems: "center", color: "var(--bg)", fontWeight: 800 }}
            >
              FD
            </motion.div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>Install FitDecay for offline access</div>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>
                On iPhone, tap Share, then Add to Home Screen. Android may show an install button in your browser menu.
              </div>
            </div>
            <button className="btn-ghost pressable" onClick={dismiss} style={{ minHeight: 44 }}>Not now</button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
