import { useState, useRef, useEffect } from 'react';
import { SkyLogo } from './PublicShell.jsx';

// Top navigation for the logged-in app. Replaces the old sidebar.
// Mirrors the public landing's pill-nav language.
export default function AppNav({
  activeTab, setActiveTab, user,
  isDark, setIsDark,
  modelChoice, onModelChange,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const TABS = ['Home', 'New Analysis', 'Media Library', 'Projects', 'Telemetry', 'Reports'];

  const tab = (label) => {
    const active = activeTab === label;
    return (
      <button
        key={label}
        onClick={() => setActiveTab(label)}
        className="text-[13.5px] font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap"
        style={{
          background: active ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'transparent',
          color: active ? '#fff' : 'var(--sky-ink-soft)',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--sky-ink)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--sky-ink-soft)'; }}
      >
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 flex justify-center px-4 sm:px-6 py-3.5"
            style={{ background: 'var(--sky-bg)', borderBottom: '1px solid var(--sky-line)' }}>
      <div className="w-full max-w-[1400px] flex items-center justify-between gap-4">
        {/* Brand */}
        <button onClick={() => setActiveTab('Home')} className="flex items-center gap-2.5 shrink-0" style={{ color: 'var(--sky-ink)' }}>
          <SkyLogo size={28} />
          <span className="font-semibold text-[18px] tracking-tight hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>SkyInnovators</span>
        </button>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full p-1"
             style={{ background: 'var(--sky-pill)', border: '1px solid var(--sky-line)' }}>
          {TABS.map(tab)}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Model toggle V1/V2 */}
          <div className="flex rounded-full p-0.5" style={{ background: 'var(--sky-pill)', border: '1px solid var(--sky-line)' }} title="Choose which AI model to use">
            {['segformer', 'ensemble'].map((val, i) => {
              const on = modelChoice === val;
              return (
                <button key={val} onClick={() => onModelChange(val)}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{ background: on ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'transparent', color: on ? '#fff' : 'var(--sky-ink-soft)' }}>
                  {i === 0 ? 'V1' : 'V2'}
                </button>
              );
            })}
          </div>

          {/* Theme */}
          <button onClick={() => setIsDark(v => !v)} aria-label="Toggle theme"
            className="w-9 h-9 grid place-items-center rounded-full transition-colors"
            style={{ border: '1px solid var(--sky-line)', background: 'var(--sky-card)', color: 'var(--sky-ink-soft)' }}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5l-1.5 1.5m-9 9l-1.5 1.5m0-12l1.5 1.5m9 9l1.5 1.5" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)}
              className="w-9 h-9 rounded-full grid place-items-center font-bold text-white text-[14px]"
              style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 animate-fade-in"
                   style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sky-line)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--sky-ink)' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--sky-ink-soft)' }}>{user?.email}</p>
                </div>
                <button onClick={() => { setActiveTab('Settings'); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors"
                  style={{ color: 'var(--sky-ink)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--sky-pill)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Account Settings
                </button>
                <div style={{ borderTop: '1px solid var(--sky-line)' }}>
                  <button onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors"
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-center gap-1 px-2 py-2 overflow-x-auto z-40"
           style={{ background: 'var(--sky-card)', borderTop: '1px solid var(--sky-line)' }}>
        {TABS.map(tab)}
      </div>
    </header>
  );
}
