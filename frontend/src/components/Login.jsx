import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config.js';
import { GoogleLogin } from '@react-oauth/google';
import { getInitialTheme, applyTheme } from '../lib/theme.js';
import { SkyLogo } from './PublicShell.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [view, setView] = useState('login');
  const isLoginView = view === 'login';
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('sky_token');
    if (token) navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Dark-default theme, with a toggle on this page
  const [isDark, setIsDark] = useState(getInitialTheme);
  useEffect(() => { applyTheme(isDark); }, [isDark]);

  // ── Validation ──
  const validateEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*]/.test(pwd)) return "Password must contain a special character (!@#$%^&*).";
    return null;
  };

  const isEmailValid = email.length > 0 && validateEmail(email);
  const isEmailInvalid = email.length > 0 && !isEmailValid;
  const pwdError = validatePassword(password);
  const isPwdValid = isLoginView ? password.length > 0 : (password.length > 0 && pwdError === null);
  const isPwdInvalid = !isLoginView && password.length > 0 && pwdError !== null;
  const isConfirmPwdValid = confirmPassword.length > 0 && password === confirmPassword;
  const isNameValid = fullName.trim().length > 0;

  const isFormReady = view === 'forgot'
    ? isEmailValid
    : isLoginView
      ? (isEmailValid && password.length > 0)
      : (isNameValid && isEmailValid && isPwdValid && isConfirmPwdValid);

  const inputStyle = (valid, invalid) => ({
    width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 12, outline: 'none',
    background: 'var(--sky-bg-soft)', color: 'var(--sky-ink)',
    border: `1px solid ${valid ? '#22c55e' : invalid ? '#ef4444' : 'var(--sky-line)'}`,
  });

  const handleForgotPassword = async (e) => {
    e.preventDefault(); setErrorMessage(''); setSuccessMessage(''); setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Something went wrong");
      setSuccessMessage("If an account exists, a reset link has been sent to your email.");
    } catch (error) { setErrorMessage(error.message); } finally { setIsLoading(false); }
  };

  const handleAuth = async (e) => {
    e.preventDefault(); setErrorMessage(''); setSuccessMessage(''); setIsLoading(true);
    if (view === 'signup') {
      if (!validateEmail(email)) { setErrorMessage("Please enter a valid email address."); setIsLoading(false); return; }
      if (password !== confirmPassword) { setErrorMessage("Passwords do not match. Please try again."); setIsLoading(false); return; }
      const passwordError = validatePassword(password);
      if (passwordError) { setErrorMessage(passwordError); setIsLoading(false); return; }
      try {
        const response = await fetch(`${API_URL}signup`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName || "Sky Innovators User" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to create account");
        setSuccessMessage("Account created! You may now sign in.");
        setPassword(''); setConfirmPassword(''); setEmail(''); setFullName('');
        setView('login');
      } catch (error) { setErrorMessage(error.message); } finally { setIsLoading(false); }
    } else {
      try {
        const response = await fetch(`${API_URL}login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Invalid email or password");
        sessionStorage.setItem("sky_token", data.access_token);
        sessionStorage.setItem("sky_user", JSON.stringify(data.user_info));
        navigate('/dashboard');
      } catch (error) { setErrorMessage(error.message); } finally { setIsLoading(false); }
    }
  };

  const handleGoogleLogin = async (idToken) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}auth/google`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: idToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Google Auth Failed");
      sessionStorage.setItem("sky_token", data.access_token);
      sessionStorage.setItem("sky_user", JSON.stringify(data.user_info));
      navigate('/dashboard');
    } catch (error) { setErrorMessage(error.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--sky-bg)', color: 'var(--sky-ink)', fontFamily: 'var(--font-body)' }}>
      {/* LEFT — form */}
      <div className="w-full lg:w-[46%] flex flex-col px-8 sm:px-16 md:px-20 py-8 relative">
        {/* Top bar: back to home + theme */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--sky-ink-soft)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--sky-accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--sky-ink-soft)'}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to home
          </Link>
          <button onClick={() => setIsDark(v => !v)} aria-label="Toggle theme"
            className="w-9 h-9 grid place-items-center rounded-full transition-colors"
            style={{ border: '1px solid var(--sky-line)', background: 'var(--sky-card)', color: 'var(--sky-ink-soft)' }}>
            {isDark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5l-1.5 1.5m-9 9l-1.5 1.5m0-12l1.5 1.5m9 9l1.5 1.5" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto">
          <div className="flex items-center gap-2.5 mb-8">
            <SkyLogo size={32} />
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SkyInnovators</span>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            {view === 'forgot' ? "Reset your password" : isLoginView ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--sky-ink-soft)' }}>
            {view === 'forgot' ? "Remember it? " : isLoginView ? "New to SkyInnovators? " : "Already have an account? "}
            <button
              onClick={() => { setView(view === 'forgot' || !isLoginView ? 'login' : 'signup'); setErrorMessage(''); setSuccessMessage(''); setConfirmPassword(''); setPassword(''); }}
              className="font-semibold hover:underline" style={{ color: 'var(--sky-accent)' }}>
              {view === 'forgot' || !isLoginView ? "Sign in" : "Create one free"}
            </button>
          </p>

          <div className="flex justify-center w-full mb-6">
            <GoogleLogin onSuccess={r => handleGoogleLogin(r.credential)} onError={() => setErrorMessage("Google Login Failed")} useOneTap shape="pill" />
          </div>

          <div className="flex items-center w-full mb-6">
            <div className="flex-1 border-t" style={{ borderColor: 'var(--sky-line)' }} />
            <span className="px-4 text-xs" style={{ color: 'var(--sky-ink-soft)' }}>or</span>
            <div className="flex-1 border-t" style={{ borderColor: 'var(--sky-line)' }} />
          </div>

          {errorMessage && (
            <div className="w-full p-3 mb-4 rounded-xl text-sm flex items-start gap-2 animate-fade-in"
                 style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="w-full p-3 mb-4 rounded-xl text-sm flex items-start gap-2 animate-fade-in"
                 style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="w-full space-y-3 mb-4">
            {view === 'signup' && (
              <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={inputStyle(isNameValid, false)} className="animate-fade-in" />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle(isEmailValid, isEmailInvalid)} />
            {view !== 'forgot' && (
              <>
                <input type="password" placeholder={isLoginView ? "Password" : "Create a password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} style={inputStyle(isPwdValid, isPwdInvalid)} />
                {!isLoginView && (
                  <p className="text-left text-[10px] px-1" style={{ color: isPwdValid ? '#22c55e' : isPwdInvalid ? '#ef4444' : 'var(--sky-ink-soft)' }}>
                    {isPwdValid ? "✓ Strong password" : (pwdError || "Must contain 8+ chars, 1 uppercase, 1 number, & 1 special char.")}
                  </p>
                )}
                {isLoginView && (
                  <div className="w-full text-right">
                    <button onClick={() => { setView('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                      className="text-[11px] font-bold hover:underline" style={{ color: 'var(--sky-accent)' }}>Forgot password?</button>
                  </div>
                )}
                {view === 'signup' && (
                  <input type="password" placeholder="Confirm password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle(isConfirmPwdValid, confirmPassword.length > 0 && !isConfirmPwdValid)} className="animate-fade-in" />
                )}
              </>
            )}
          </div>

          <button onClick={view === 'forgot' ? handleForgotPassword : handleAuth} disabled={!isFormReady || isLoading}
            className="w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: (isFormReady && !isLoading) ? 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' : 'var(--sky-pill)',
              color: (isFormReady && !isLoading) ? '#fff' : 'var(--sky-ink-soft)',
              cursor: (isFormReady && !isLoading) ? 'pointer' : 'not-allowed',
            }}>
            {isLoading
              ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Processing…</>
              : (view === 'forgot' ? "Send reset link" : isLoginView ? "Sign in" : "Create account")}
          </button>

          <p className="mt-6 text-xs" style={{ color: 'var(--sky-ink-soft)' }}>
            By continuing, you agree to SkyInnovators' <a href="#" className="underline">Terms of Service</a>.
          </p>
        </div>

        <div className="text-center text-xs" style={{ color: 'var(--sky-ink-soft)' }}>© {new Date().getFullYear()} SkyInnovators</div>
      </div>

      {/* RIGHT — brand panel with new copy */}
      <div className="hidden lg:flex w-[54%] relative items-center justify-center overflow-hidden"
           style={{ borderLeft: '1px solid var(--sky-line)', background: 'var(--sky-bg-soft)' }}>
        <div className="absolute inset-0" style={{ background: 'var(--sky-hero-glow)' }} />
        {/* orbit rings */}
        <div className="absolute rounded-full animate-pulse" style={{ width: 760, height: 760, border: '1px solid var(--sky-orbit)' }} />
        <div className="absolute rounded-full" style={{ width: 560, height: 560, border: '1px solid var(--sky-orbit)' }} />
        <div className="relative z-10 text-center space-y-6 max-w-md px-8">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
               style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
            <SkyLogo size={44} />
          </div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>
            Turn drone footage into<br />
            <span style={{ background: 'linear-gradient(120deg, var(--sky-accent), var(--sky-accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>forest intelligence</span>
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--sky-ink-soft)' }}>
            Sign in to upload aerial imagery and get pixel-level maps of canopy health, dead trees, water, and terrain — in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
