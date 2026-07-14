import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getInitialTheme, applyTheme } from '../lib/theme.js';

// Logo mark — hexagonal aerial "scan" frame with a drone/leaf shape.
export function SkyLogo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 L27 9 L27 22 L16 29 L5 22 L5 9 Z"
            stroke="var(--sky-accent)" strokeWidth="1.6" fill="none" opacity="0.35" />
      <path d="M16 9 L21 16 L16 23 L11 16 Z" fill="var(--sky-accent)" />
      <circle cx="16" cy="16" r="2.2" fill="var(--sky-bg)" />
    </svg>
  );
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialTheme);
  useEffect(() => { applyTheme(isDark); }, [isDark]);
  return [isDark, setIsDark];
}

function ThemeToggle({ isDark, setIsDark }) {
  return (
    <button
      onClick={() => setIsDark(v => !v)}
      aria-label="Toggle color theme"
      className="w-10 h-10 grid place-items-center rounded-full border transition-colors"
      style={{ borderColor: 'var(--sky-line)', background: 'var(--sky-card)', color: 'var(--sky-ink-soft)' }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5l-1.5 1.5m-9 9l-1.5 1.5m0-12l1.5 1.5m9 9l1.5 1.5" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function PublicShell({ children, isDark, setIsDark }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const link = (to, label) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMenuOpen(false)}
        className="text-[14.5px] font-medium px-4 py-2 rounded-full transition-colors"
        style={{ color: active ? 'var(--sky-ink)' : 'var(--sky-ink-soft)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--sky-pill)'; e.currentTarget.style.color = 'var(--sky-ink)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? 'var(--sky-ink)' : 'var(--sky-ink-soft)'; }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ background: 'var(--sky-bg)', color: 'var(--sky-ink)', minHeight: '100vh' }}>
      {/* NAV */}
      <div className="sticky top-0 z-50 px-4 sm:px-6 py-4 flex justify-center">
        <nav className="w-full max-w-6xl flex items-center justify-between rounded-full pl-6 pr-3 py-2.5"
             style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <Link to="/" className="flex items-center gap-2.5" style={{ color: 'var(--sky-ink)' }}>
            <SkyLogo />
            <span className="font-semibold text-[19px] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SkyInnovators</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {link('/', 'Home')}
            {link('/about', 'About')}
            {link('/contact', 'Contact')}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
            <button
              onClick={() => navigate('/login')}
              className="text-[14.5px] font-semibold px-5 py-2.5 rounded-full transition-transform hover:-translate-y-0.5"
              style={{ color: '#fff', background: isDark ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-ink)' }}
            >
              Sign in
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile links row */}
      <div className="md:hidden flex justify-center gap-2 pb-2">
        {link('/', 'Home')}{link('/about', 'About')}{link('/contact', 'Contact')}
      </div>

      {children}

      {/* FOOTER */}
      <footer className="mt-10 border-t" style={{ borderColor: 'var(--sky-line)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <SkyLogo size={26} />
            <span className="font-semibold text-[17px] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SkyInnovators</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--sky-ink-soft)' }}>
            Drone-based forest health intelligence · {new Date().getFullYear()}
          </p>
          <div className="flex gap-5 text-sm" style={{ color: 'var(--sky-ink-soft)' }}>
            <Link to="/about" style={{ color: 'inherit' }}>About</Link>
            <Link to="/contact" style={{ color: 'inherit' }}>Contact</Link>
            <Link to="/login" style={{ color: 'inherit' }}>Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
