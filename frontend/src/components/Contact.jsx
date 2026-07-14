import { useState } from 'react';
import PublicShell, { useTheme } from './PublicShell.jsx';

export default function Contact() {
  const [isDark, setIsDark] = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const field = (v) => ({
    background: 'var(--sky-card)', border: '1px solid var(--sky-line)',
    color: 'var(--sky-ink)', borderRadius: 12, padding: '12px 14px',
    fontSize: 15, width: '100%', outline: 'none',
  });

  const submit = (e) => {
    e.preventDefault();
    // Opens the user's mail client — no backend change needed.
    const subject = encodeURIComponent(`SkyInnovators enquiry from ${form.name || 'a visitor'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
    window.location.href = `mailto:info@skyinnovators.com?subject=${subject}&body=${body}`;
  };

  return (
    <PublicShell isDark={isDark} setIsDark={setIsDark}>
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-4 text-center">
        <p className="text-[13px] font-semibold tracking-[0.08em] uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-accent)' }}>Contact</p>
        <h1 className="font-bold tracking-tight mt-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
          Let's talk
        </h1>
        <p className="max-w-md mx-auto mt-5 text-[17px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
          Questions about a survey, a partnership, or the platform? Send a note and we'll get back to you.
        </p>
      </section>

      <section className="max-w-xl mx-auto px-6 py-10">
        <form onSubmit={submit} className="rounded-[20px] p-7 space-y-4" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Your name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={field()} placeholder="Jane Forester" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Email</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={field()} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--sky-ink-soft)' }}>Message</label>
            <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...field(), resize: 'vertical' }} placeholder="Tell us about your project…" />
          </div>
          <button type="submit" className="w-full text-[15px] font-semibold py-3.5 rounded-full text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: isDark ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-ink)' }}>
            Send message
          </button>
        </form>

        <div className="mt-6 text-center text-[14px]" style={{ color: 'var(--sky-ink-soft)' }}>
          Or email us directly at{' '}
          <a href="mailto:info@skyinnovators.com" style={{ color: 'var(--sky-accent)', fontWeight: 600 }}>info@skyinnovators.com</a>
        </div>
      </section>
    </PublicShell>
  );
}
