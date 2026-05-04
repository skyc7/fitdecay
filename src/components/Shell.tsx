import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useFitDecay } from '../lib/DataContext';
import { InstallPrompt } from './InstallPrompt';
import { PageTransition } from './PageTransition';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/baselines',
    label: 'Baselines',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L5.5 7.5L8.5 9.5L12 4L14 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/plan',
    label: 'Re-Entry Plan',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/science',
    label: 'Evidence',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2.5H10.5L13 5V13.5H4V2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M10.5 2.5V5H13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6 8H11M6 10.5H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    end: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1.8V3.2M8 12.8V14.2M14.2 8H12.8M3.2 8H1.8M12.4 3.6L11.4 4.6M4.6 11.4L3.6 12.4M12.4 12.4L11.4 11.4M4.6 4.6L3.6 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Shell() {
  const { data, loadDemo } = useFitDecay();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return;
      if (event.key === 'n') navigate('/layoffs/new');
      if (event.key === 'b') navigate('/baselines');
      if (event.key === '?') setHelpOpen((value) => !value);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setHelpOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar (desktop) ── */}
      <aside
        style={{
          width: collapsed ? 56 : 220,
          minWidth: collapsed ? 56 : 220,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          transition: 'width 200ms ease-out, min-width 200ms ease-out',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 10,
          flexShrink: 0,
        }}
        className="hidden lg:flex"
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '0 16px 24px' : '0 20px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <button
            onClick={() => { setCollapsed((c) => !c); navigate('/'); }}
            style={{
              width: 24, height: 24,
              background: 'var(--accent)',
              borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L5 4L8 7L10 2" stroke="#0A0A0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 150ms',
          }}>
            FitDecay
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 7,
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: isActive ? 'var(--card)' : 'transparent',
                transition: 'background 150ms, color 150ms',
                whiteSpace: 'nowrap',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: 500,
              })}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              <span style={{
                opacity: collapsed ? 0 : 1,
                transition: 'opacity 150ms',
                pointerEvents: collapsed ? 'none' : 'auto',
              }}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 10px 0',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={loadDemo}
            style={{
              width: '100%',
              padding: collapsed ? '8px' : '8px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 150ms',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6.5 2v7M4 7l2.5 2.5L9 7M2 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span>Load Demo Data</span>}
          </button>
          {!collapsed && (
            <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              {data.baselines.length} baselines, {data.layoffs.length} layoffs stored locally.
            </p>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: '32px 36px 80px',
        maxWidth: 1140,
      }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <InstallPrompt />
      {helpOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', padding: 16 }} onMouseDown={(e) => e.target === e.currentTarget && setHelpOpen(false)}>
          <section className="card" style={{ width: 'min(460px, 100%)', padding: 22 }}>
            <span className="label">Shortcuts</span>
            <h2 className="tight" style={{ margin: '8px 0 16px' }}>Move around faster</h2>
            {[
              ['n', 'New layoff'],
              ['b', 'Baselines'],
              ['?', 'Open this help'],
              ['⌘K', 'Command help'],
            ].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <kbd className="mono" style={{ color: 'var(--accent)' }}>{key}</kbd>
              </div>
            ))}
            <button className="btn-primary pressable" style={{ width: '100%', marginTop: 16 }} onClick={() => setHelpOpen(false)}>Got it</button>
          </section>
        </div>
      )}

      {/* ── Bottom nav (mobile) ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        className="flex lg:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 4px',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.02em',
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
