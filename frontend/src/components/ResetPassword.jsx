import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // 👉 New state for UI switch
  const navigate = useNavigate();
  
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
        body: JSON.stringify({ 
          token: token, 
          new_password: password 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");

      // 👉 Instead of alert(), we set success to true
      setIsSuccess(true); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 👉 NEW: Success View
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 border border-gray-100 dark:border-gray-700 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Password Updated</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Your account is now secure. You can log in with your new password.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Secure Reset</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your new secure password below.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-800 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <input 
              type="password" 
              placeholder="New Password" 
              className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && <p className={`text-[10px] mt-1 font-medium ${pwdError ? 'text-gray-400' : 'text-emerald-500'}`}>{pwdError || "✓ Strong password"}</p>}
          </div>

          <input 
            type="password" 
            placeholder="Confirm New Password" 
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button 
            disabled={loading || pwdError || !isMatch}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}