import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Preference = 'light' | 'dark' | 'system';
type ThemeContextValue = { preference: Preference; setPreference: (theme: Preference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Example for an existing React app. Do not add a second provider if the app already has one.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Preference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') setPreference(saved);
    } catch { /* Storage can be blocked; system preference still works. */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const query = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { document.documentElement.dataset.theme = preference === 'system' ? (query.matches ? 'dark' : 'light') : preference; };
    apply();
    try { localStorage.setItem('app-theme', preference); } catch {}
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [preference, loaded]);

  const value = useMemo(() => ({ preference, setPreference }), [preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
