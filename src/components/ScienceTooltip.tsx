import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

const copy = {
  decay: {
    title: "Why this number?",
    body: "This estimate follows detraining research patterns scaled by your training age, activity level, and layoff reason. Return tests tighten the model toward your actual response.",
  },
  confidence: {
    title: "Why a range?",
    body: "Individual detraining response varies meaningfully across studies. FitDecay widens uncertainty over longer layoffs and narrows it as you log return tests.",
  },
  recovery: {
    title: "Why this timeline?",
    body: "Re-acquisition is usually faster than the first time you built the quality. The plan assumes structured loading over roughly 60–80% of layoff duration.",
  },
};

type TooltipPlacement = {
  left: number;
  top: number;
  width: number;
  mobile: boolean;
};

export function ScienceTooltip({ kind = "decay" }: { kind?: keyof typeof copy }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const item = copy[kind];

  const updatePlacement = useCallback(() => {
    const trigger = buttonRef.current?.getBoundingClientRect();
    if (!trigger) return;

    const gutter = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const mobile = viewportWidth < 640;
    const width = Math.min(320, viewportWidth - gutter * 2);

    if (mobile) {
      setPlacement({
        left: gutter,
        top: Math.max(gutter, viewportHeight - 230),
        width,
        mobile: true,
      });
      return;
    }

    const panelHeight = panelRef.current?.offsetHeight ?? 184;
    let left = trigger.left + trigger.width / 2 - width / 2;
    left = Math.max(gutter, Math.min(left, viewportWidth - width - gutter));

    let top = trigger.bottom + 10;
    if (top + panelHeight > viewportHeight - gutter) {
      top = Math.max(gutter, trigger.top - panelHeight - 10);
    }

    setPlacement({ left, top, width, mobile: false });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePlacement();
    const frame = window.requestAnimationFrame(updatePlacement);
    return () => window.cancelAnimationFrame(frame);
  }, [open, kind, updatePlacement]);

  useEffect(() => {
    if (!open) return;

    function onDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, updatePlacement]);

  const tooltip =
    typeof document === "undefined"
      ? null
      : createPortal(
          <AnimatePresence>
            {open && placement ? (
              <motion.div
                ref={panelRef}
                className={placement.mobile ? "mobile-sheet" : undefined}
                role="dialog"
                aria-label={item.title}
                initial={{ opacity: 0, y: placement.mobile ? 18 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: placement.mobile ? 18 : 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
                style={{
                  position: "fixed",
                  left: placement.left,
                  top: placement.top,
                  zIndex: 420,
                  width: placement.width,
                  maxWidth: "calc(100vw - 32px)",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: placement.mobile ? 18 : 12,
                  padding: placement.mobile ? 18 : 14,
                  boxShadow: "0 20px 70px rgba(0,0,0,.46)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{item.title}</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.55, margin: 0 }}>{item.body}</p>
                <Link
                  to="/science"
                  onClick={() => setOpen(false)}
                  style={{ color: "var(--accent)", fontSize: 12, display: "inline-block", marginTop: 10, textDecoration: "none", fontWeight: 700 }}
                >
                  Read the full science
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        );

  return (
    <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 6 }}>
      <button
        ref={buttonRef}
        className="icon-help pressable"
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => {
            if (value) return false;
            setPlacement(null);
            return true;
          });
        }}
        aria-label="Explain this prediction"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        ?
      </button>
      {tooltip}
    </span>
  );
}
