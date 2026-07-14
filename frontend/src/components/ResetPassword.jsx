import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config.js';
import { getInitialTheme, applyTheme } from '../lib/theme.js';
import { SkyLogo } from './PublicShell.jsx';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const [isDark] = useState(getInitialTheme);
  useEffect(() => { applyTheme(isDark); }, [isDark]);

  const token = searchParams.get("token");

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Include an uppercase letter.";
    if (!/[0-9]/.test(pwd)) return "Include a number.";
    if (!/[!@#$%^&*]/.test(pwd)) return "Include a special character.";
    return null;
  };

  const pwdError = validatePassword(password);
  const isMatch = password === confirmPassword && confirmPassword !== '';

  const handleReset = async (e) => {
    e.preventDefault();
    if (pwdError) { setError(pwdError); return; }
    if (!isMatch) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)',
    color: 'var(--sky-ink)', borderRadius: 12, padding: '12px 14px',
    fontSize: 14, width: '100%', outline: 'none',
  };
  const btnStyle = (enabled) => ({
    background: enabled ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-pill)',
    color: enabled ? '#fff' : 'var(--sky-ink-soft)',
    cursor: enabled ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--sky-bg)' }}>
      <div className="max-w-md w-full rounded-3xl p-8 animate-fade-in"
           style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', boxShadow: '0 12px 48px rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <SkyLogo size={28} />
          <span className="font-semibold text-[18px] tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>SkyInnovators</span>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-6" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Password Updated</h2>
            <p className="mb-8 text-[15px]" style={{ color: 'var(--sky-ink-soft)' }}>Your account is now secure. You can sign in with your new password.</p>
            <button onClick={() => navigate('/login')} className="w-full py-3 rounded-full font-semibold text-[15px]" style={btnStyle(true)}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Secure reset</h2>
            <p className="text-[14px] mb-6" style={{ color: 'var(--sky-ink-soft)' }}>Enter your new secure password below.</p>

            {error && (
              <div className="mb-4 p-3 text-xs rounded-xl" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <input type="password" placeholder="New Password" style={inputStyle}
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                {password && <p className="text-[10px] mt-1 font-medium" style={{ color: pwdError ? 'var(--sky-ink-soft)' : '#22c55e' }}>{pwdError || "\u2713 Strong password"}</p>}
              </div>
              <input type="password" placeholder="Confirm New Password" style={inputStyle}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="submit" disabled={loading || pwdError || !isMatch} className="w-full py-3 rounded-full font-semibold text-[15px] transition-all" style={btnStyle(!(loading || pwdError || !isMatch))}>
                {loading ? "Updating\u2026" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
