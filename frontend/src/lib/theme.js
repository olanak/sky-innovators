// src/lib/theme.js
// Shared theme handling. Dark is the DEFAULT when no preference is saved.
// A returning user's saved choice ('light' | 'dark') is always respected.

export function getInitialTheme() {
  const saved = sessionStorage.getItem('sky_theme');
  if (saved === 'light') return false; // explicit light
  if (saved === 'dark') return true;   // explicit dark
  return true;                          // default → dark
}

export function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    sessionStorage.setItem('sky_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    sessionStorage.setItem('sky_theme', 'light');
  }
}
