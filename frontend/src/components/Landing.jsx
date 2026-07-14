import { useNavigate } from 'react-router-dom';
import PublicShell, { useTheme } from './PublicShell.jsx';

function OrbitSignature() {
  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ height: 340, marginTop: 30, marginBottom: -20, zIndex: 1 }}>
      <svg viewBox="0 0 680 340" className="w-full h-full" style={{ overflow: 'visible' }}>
        <circle cx="340" cy="170" r="150" fill="none" stroke="var(--sky-orbit)" strokeWidth="1" />
        <circle cx="340" cy="170" r="100" fill="none" stroke="var(--sky-orbit)" strokeWidth="1" />
        <circle cx="340" cy="170" r="54" fill="var(--sky-card)" stroke="var(--sky-line)" strokeWidth="1.5" />
        <text x="340" y="166" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, fill: 'var(--sky-ink)' }}>Canopy</text>
        <text x="340" y="182" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: 10, fill: 'var(--sky-ink-soft)' }}>scan</text>
        <g className="sky-rotating" style={{ transformOrigin: '340px 170px' }}>
          <circle cx="340" cy="20" r="9" fill="var(--sky-accent)" />
          <g><circle cx="440" cy="170" r="17" fill="var(--sky-card)" stroke="var(--sky-line)" strokeWidth="1.5" /><circle cx="440" cy="170" r="5" fill="#22c55e" /></g>
          <g><circle cx="290" cy="257" r="17" fill="var(--sky-card)" stroke="var(--sky-line)" strokeWidth="1.5" /><circle cx="290" cy="257" r="5" fill="#8b5a2b" /></g>
          <g><circle cx="290" cy="83" r="17" fill="var(--sky-card)" stroke="var(--sky-line)" strokeWidth="1.5" /><circle cx="290" cy="83" r="5" fill="#1e90ff" /></g>
        </g>
      </svg>
    </div>
  );
}

function ModuleCard({ bg, color, icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-[20px] p-7 cursor-pointer transition-all hover:-translate-y-1"
      style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sky-accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sky-line)'; }}
    >
      <div className="w-[46px] h-[46px] rounded-xl grid place-items-center mb-4" style={{ background: bg, color }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      </div>
      <h3 className="text-[18px] font-semibold mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>{title}</h3>
      <p className="text-[14.5px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>{desc}</p>
    </div>
  );
}

export default function Landing() {
  const [isDark, setIsDark] = useTheme();
  const navigate = useNavigate();
  const toLogin = () => navigate('/login');

  return (
    <PublicShell isDark={isDark} setIsDark={setIsDark}>
      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-14 pb-10 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--sky-hero-glow)' }} />
        <div className="relative z-[2] inline-flex items-center gap-4 text-[13.5px] mb-6" style={{ color: 'var(--sky-ink-soft)' }}>
          <span><b style={{ color: 'var(--sky-ink)', fontWeight: 600 }}>8-class</b> segmentation</span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--sky-line)' }} />
          <span><b style={{ color: 'var(--sky-ink)', fontWeight: 600 }}>Drone-native</b> AI</span>
        </div>
        <h1 className="relative z-[2] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px,6vw,68px)', lineHeight: 1.04, letterSpacing: '-0.03em' }}>
          See the health of<br />every forest{' '}
          <span style={{ background: 'linear-gradient(120deg, var(--sky-accent), var(--sky-accent-2))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>from above</span>
        </h1>
        <p className="relative z-[2] max-w-xl mx-auto mt-6 text-[17px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
          SkyInnovators turns raw drone footage into pixel-level forest intelligence — mapping healthy canopy, stressed and dead trees, water, and terrain in seconds.
        </p>
        <div className="relative z-[2] flex gap-3 justify-center mt-8">
          <button onClick={toLogin} className="text-[15px] font-semibold px-7 py-3.5 rounded-full text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: isDark ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-ink)' }}>
            Start analyzing
          </button>
          <button onClick={() => navigate('/about')} className="text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors"
                  style={{ background: 'transparent', border: '1px solid var(--sky-line)', color: 'var(--sky-ink)' }}>
            See how it works
          </button>
        </div>
        <OrbitSignature />
      </section>

      {/* MODULES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-accent)' }}>What it maps</p>
        <h2 className="font-bold tracking-tight text-center mt-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.02em' }}>Three modules, one upload</h2>
        <p className="max-w-lg mx-auto mt-4 text-center text-[16px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
          Every frame is classified into eight land-cover types, then summarized into the metrics that matter for each kind of survey. Sign in to run your first analysis.
        </p>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          <ModuleCard onClick={toLogin} bg="rgba(34,197,94,0.1)" color="#22c55e"
            icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            title="Forestry & Environment" desc="Measure healthy canopy, flag stressed and dead trees, and get a trees-only health score for every survey." />
          <ModuleCard onClick={toLogin} bg="rgba(245,158,11,0.1)" color="#f59e0b"
            icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            title="Land & Vegetation" desc="Quantify low vegetation and exposed bare soil coverage to track ground condition across a site." />
          <ModuleCard onClick={toLogin} bg="rgba(59,130,246,0.1)" color="#3b82f6"
            icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            title="Infrastructure & Hydrology" desc="Detect roads, buildings, and water bodies, each reported as clear coverage across the scanned area." />
        </div>
      </section>

      {/* CTA BAND */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="rounded-[24px] px-8 py-14 text-center relative overflow-hidden"
             style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>
          <h2 className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,36px)', letterSpacing: '-0.02em' }}>
            Ready to map your first flight?
          </h2>
          <p className="max-w-md mx-auto mt-3 text-[16px]" style={{ color: 'var(--sky-ink-soft)' }}>
            Upload drone footage and get a colour-coded health report in seconds.
          </p>
          <button onClick={toLogin} className="mt-7 text-[15px] font-semibold px-8 py-3.5 rounded-full text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: isDark ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-ink)' }}>
            Sign in to start
          </button>
        </div>
      </section>
    </PublicShell>
  );
}
