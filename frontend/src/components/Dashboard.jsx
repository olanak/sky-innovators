import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config.js';
import { getInitialTheme, applyTheme } from '../lib/theme.js';
import AppNav from './AppNav.jsx';
import NewAnalysis from './NewAnalysis.jsx';
import Projects from './pro';
import TelemetryData from './TelemetryData';
import ExportedReports from './ExportedReports';
import AccountSettings from './AccountSettings';
import AnalysisReport from './AnalysisReport';
import MediaLibrary from './MediaLibrary';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Home');
  const [lastTab, setLastTab] = useState('Home');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisModule, setAnalysisModule] = useState(null);
  const [existingFile, setExistingFile] = useState(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total_projects: 0, total_files: 0, total_area_scanned: '0 Ha', active_models: 0 });
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [modelChoice, setModelChoice] = useState(() => localStorage.getItem('sky_model') || 'segformer');
  const [user, setUser] = useState({ name: 'User', email: 'Loading…' });
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => { applyTheme(isDark); }, [isDark]);

  const handleModelChange = (c) => { setModelChoice(c); localStorage.setItem('sky_model', c); };

  // Auth + user bootstrap
  useEffect(() => {
    const token = sessionStorage.getItem('sky_token');
    if (!token) { navigate('/login'); return; }
    const stored = sessionStorage.getItem('sky_user');
    if (stored) setUser(JSON.parse(stored));
    setAuthChecking(false);
  }, [navigate]);

  // Stats on Home
  useEffect(() => {
    if (activeTab !== 'Home') return;
    const token = sessionStorage.getItem('sky_token');
    if (!token) return;
    fetch(`${API_URL}dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
  }, [activeTab]);

  const handleLogout = () => {
    sessionStorage.removeItem('sky_token');
    sessionStorage.removeItem('sky_user');
    navigate('/');
  };

  // Load a completed analysis into the report view
  const viewAnalysis = async (asset) => {
    setLastTab(activeTab);
    const token = sessionStorage.getItem('sky_token');
    try {
      const res = await fetch(`${API_URL}media/${asset.id}/results`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const results = await res.json();
        setAnalysisData({ id: asset.id, filename: asset.filename, aiResults: results });
        setActiveTab('AnalysisReport');
      }
    } catch (e) { console.error('Failed to load results', e); }
  };

  // Start a new analysis (from Home module cards or nav)
  const startNew = (module = null, file = null) => {
    setAnalysisModule(module);
    setExistingFile(file);
    setActiveTab('New Analysis');
  };

  // Called by NewAnalysis when SSE completes
  const onAnalysisComplete = (data) => {
    setAnalysisData(data);
    setLastTab('Home');
    setActiveTab('AnalysisReport');
    setExistingFile(null);
    setAnalysisModule(null);
  };

  if (authChecking) {
    return <div className="h-screen w-full" style={{ background: 'var(--sky-bg)' }} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sky-bg)', color: 'var(--sky-ink)', fontFamily: 'var(--font-body)' }}>
      <AppNav
        activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); }}
        user={user} isDark={isDark} setIsDark={setIsDark}
        modelChoice={modelChoice} onModelChange={handleModelChange}
        onLogout={handleLogout}
      />

      <main className="pb-24 lg:pb-10">
        {activeTab === 'Home' && <HomeView stats={stats} onStart={startNew} setActiveTab={setActiveTab} />}
        {activeTab === 'New Analysis' && (
          <NewAnalysis existingFile={existingFile} preselectedModule={analysisModule} onComplete={onAnalysisComplete} />
        )}
        {activeTab === 'Media Library' && (
          <MediaLibrary onAnalyze={(file) => startNew(null, file)} onView={viewAnalysis} />
        )}
        {activeTab === 'Projects' && (
          <Projects onAnalyze={(file) => startNew(null, file)} onView={viewAnalysis} />
        )}
        {activeTab === 'Telemetry' && <TelemetryData />}
        {activeTab === 'Reports' && <ExportedReports />}
        {activeTab === 'Settings' && <AccountSettings />}
        {activeTab === 'AnalysisReport' && (
          <AnalysisReport analysisData={analysisData} onBack={() => setActiveTab(lastTab)} />
        )}
      </main>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeView({ stats, onStart, setActiveTab }) {
  const MODS = [
    { key: 'forestry', title: 'Forestry & Environment', desc: 'Map healthy canopy and flag stressed or dead trees.', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'land', title: 'Land & Vegetation', desc: 'Measure low vegetation and exposed bare soil.', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { key: 'infrastructure', title: 'Infrastructure & Hydrology', desc: 'Detect roads, buildings and water bodies.', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  ];
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
      {/* Hero banner */}
      <div className="rounded-3xl p-8 mb-8 relative overflow-hidden"
           style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--sky-hero-glow)' }} />
        <div className="relative z-[2] max-w-xl">
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>
            Advanced land-cover<br /><span style={{ background: 'linear-gradient(120deg, var(--sky-accent), var(--sky-accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>mapping &amp; analysis</span>
          </h1>
          <p className="text-[14px] mb-5 leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
            Detect forest health across your <b style={{ color: 'var(--sky-ink)' }}>{stats.total_projects}</b> projects. You've processed <b style={{ color: 'var(--sky-accent)' }}>{stats.total_files}</b> media {stats.total_files === 1 ? 'file' : 'files'} — images &amp; videos.
          </p>
          <button onClick={() => onStart(null, null)}
            className="text-[14px] font-semibold px-6 py-3 rounded-full text-white inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
            Start new analysis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>

      <h2 className="text-[18px] font-bold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Analysis modules</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODS.map(m => (
          <button key={m.key} onClick={() => onStart(m.key, null)}
            className="text-left rounded-2xl p-5 flex gap-4 transition-all hover:-translate-y-1"
            style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sky-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--sky-line)'}>
            <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: m.bg, color: m.color }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={m.icon} /></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--sky-ink)' }}>{m.title}</h3>
              <p className="text-[13px] leading-snug" style={{ color: 'var(--sky-ink-soft)' }}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
