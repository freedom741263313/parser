import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'violet' | 'ocean' | 'forest';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: { id: Theme; name: string; color: string }[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'violet', name: '梦幻紫', color: 'hsl(265, 89%, 60%)' },
  { id: 'ocean', name: '深海蓝', color: 'hsl(217, 91%, 60%)' },
  { id: 'forest', name: '森系绿', color: 'hsl(142, 71%, 45%)' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'violet';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all theme classes
    themes.forEach(t => root.classList.remove(`theme-${t.id}`));
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    // Also set data attribute for flexibility
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
