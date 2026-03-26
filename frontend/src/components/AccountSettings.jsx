import { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

export default function AccountSettings() {
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' }); // New state for passwords
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Fetch real user data on load
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('sky_token');
      try {
        const response = await fetch(`${API_URL}users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, []);

  // Password Policy Check
  const validatePassword = (pw) => {
    return /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/.test(pw);
  };

  // 2. Handle Profile Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation for password change
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
    const token = localStorage.getItem('sky_token');

    try {
      const response = await fetch(`${API_URL}users/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          current_password: passwords.current || null,
          new_password: passwords.new || null
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('sky_user', JSON.stringify({
          name: updatedUser.full_name,
          email: updatedUser.email
        }));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setPasswords({ current: '', new: '', confirm: '' }); // Reset password fields
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

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h1>
      
      {/* AVATAR DISPLAY */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
          {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Avatar</p>
          <p className="text-xs text-gray-500">Based on your account name</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" 
              value={profile.full_name} 
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address (Read-only)</label>
            <input 
              type="email" 
              value={profile.email} 
              disabled
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm text-gray-500 cursor-not-allowed" 
            />
          </div>

          <hr className="border-gray-100 dark:border-gray-700 my-4" />
          
          <p className="text-sm font-bold text-gray-900 dark:text-white">Change Password</p>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
            <input 
              type="password" 
              value={passwords.current}
              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
              <input 
                type="password" 
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm" 
              />
            </div>
          </div>
        </div>

        {message.text && (
          <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isSaving}
          className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}