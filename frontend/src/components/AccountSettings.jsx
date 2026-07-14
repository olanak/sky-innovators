import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function AccountSettings() {
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem('sky_token');
      try {
        const response = await fetch(`${API_URL}users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) setProfile(await response.json());
      } catch (error) { console.error("Failed to load profile", error); }
    };
    fetchProfile();
  }, []);

  const validatePassword = (pw) => /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/.test(pw);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (passwords.new) {
      if (!validatePassword(passwords.new)) {
        setMessage({ type: 'error', text: 'Password must be 8+ characters, with 1 uppercase and 1 special character.' });
        return;
      }
      if (passwords.new !== passwords.confirm) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }
    setIsSaving(true);
    const token = sessionStorage.getItem('sky_token');
    try {
      const response = await fetch(`${API_URL}users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: profile.full_name,
          current_password: passwords.current || null,
          new_password: passwords.new || null,
        }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        sessionStorage.setItem('sky_user', JSON.stringify({ name: updatedUser.full_name, email: updatedUser.email }));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to update profile.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    background: 'var(--sky-bg-soft)', border: '1px solid var(--sky-line)', color: 'var(--sky-ink)',
    borderRadius: 12, padding: '10px 14px', fontSize: 14, width: '100%', outline: 'none',
  };
  const label = "block text-[13px] font-medium mb-1.5";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
      <h1 className="text-[28px] font-bold tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--sky-ink)' }}>Account Settings</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full grid place-items-center text-white text-2xl font-bold"
             style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))' }}>
          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--sky-ink)' }}>Profile Avatar</p>
          <p className="text-xs" style={{ color: 'var(--sky-ink-soft)' }}>Based on your account name</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="rounded-2xl p-6" style={{ background: 'var(--sky-card)', border: '1px solid var(--sky-line)' }}>
        <div className="space-y-4">
          <div>
            <label className={label} style={{ color: 'var(--sky-ink-soft)' }}>Full Name</label>
            <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label className={label} style={{ color: 'var(--sky-ink-soft)' }}>Email Address (read-only)</label>
            <input type="email" value={profile.email} disabled style={{ ...inputStyle, background: 'var(--sky-pill)', color: 'var(--sky-ink-soft)', cursor: 'not-allowed' }} />
          </div>

          <hr style={{ borderColor: 'var(--sky-line)' }} className="my-4" />
          <p className="text-sm font-bold" style={{ color: 'var(--sky-ink)' }}>Change Password</p>

          <div>
            <label className={label} style={{ color: 'var(--sky-ink-soft)' }}>Current Password</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} style={inputStyle} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label} style={{ color: 'var(--sky-ink-soft)' }}>New Password</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label className={label} style={{ color: 'var(--sky-ink-soft)' }}>Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {message.text && (
          <p className="mt-4 text-sm" style={{ color: message.type === 'success' ? '#22c55e' : '#f87171' }}>{message.text}</p>
        )}

        <button type="submit" disabled={isSaving}
          className="mt-6 font-semibold py-2.5 px-6 rounded-full text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--sky-accent), var(--sky-accent-2))', opacity: isSaving ? 0.6 : 1 }}>
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
