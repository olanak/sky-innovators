import PublicShell, { useTheme } from './PublicShell.jsx';

function Step({ n, title, desc }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 w-11 h-11 rounded-full grid place-items-center font-bold"
           style={{ fontFamily: 'var(--font-display)', background: 'var(--sky-pill)', color: 'var(--sky-accent)' }}>{n}</div>
      <div>
        <h3 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>{desc}</p>
      </div>
    </div>
  );
}

const CLASSES = [
  ['Healthy Tree', '#22c55e'], ['Dead / Stressed', '#8b5a2b'],
  ['Low Vegetation', '#9acd32'], ['Bare Soil', '#cd853f'],
  ['Water', '#1e90ff'], ['Road', '#a9a9a9'],
  ['Building', '#dc5050'], ['Background', '#64748b'],
];

export default function About() {
  const [isDark, setIsDark] = useTheme();
  return (
    <PublicShell isDark={isDark} setIsDark={setIsDark}>
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-6 text-center">
        <p className="text-[13px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-accent)' }}>About</p>
        <h1 className="font-bold tracking-tight mt-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
          Forest intelligence,<br />built for the field
        </h1>
        <p className="max-w-xl mx-auto mt-5 text-[17px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
          SkyInnovators is a drone-based platform that reads aerial footage the way a forester would — separating healthy canopy from stressed and dead trees, and mapping the land and water around them, pixel by pixel.
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="font-bold tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,34px)', letterSpacing: '-0.02em' }}>How it works</h2>
        <div className="space-y-8">
          <Step n="1" title="Upload your footage" desc="Drop in a drone image or video. Every upload is checked to confirm it looks like aerial forest footage before analysis begins." />
          <Step n="2" title="AI segments every pixel" desc="A SegFormer semantic-segmentation model classifies each pixel into one of eight land-cover types, then cleans the result into a colour-coded map." />
          <Step n="3" title="Read the health report" desc="You get a trees-only health score, tree cover, and per-class coverage — laid over your footage and exportable for your records." />
        </div>
      </section>

      {/* The 8 classes */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,34px)', letterSpacing: '-0.02em' }}>The eight classes</h2>
        <p className="text-[15px] mb-8" style={{ color: 'var(--sky-ink-soft)' }}>Every frame is broken down into these land-cover types.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CLASSES.map(([name, color]) => (
            <div key={name} className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                 style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[13.5px] font-medium" style={{ color: 'var(--sky-ink)' }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Health score explainer */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-[20px] p-8" style={{ background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)' }}>
          <h3 className="text-[18px] font-semibold tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>How the health score is measured</h3>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
            The health score looks only at trees — it's the share of healthy tree canopy out of all tree canopy in the frame, ignoring buildings, roads, soil, and water. A score of 70% or above reads as Healthy, 40–70% as Warning, and below 40% as Critical. When a scene has little or no tree cover, the score is reported as not applicable rather than a misleading number.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
