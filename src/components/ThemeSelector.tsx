import React from 'react';
import { Sun, Moon, Eye, Droplets, Palette } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface ThemeSelectorProps {
  isCollapsed?: boolean;
}

export function ThemeSelector({ isCollapsed }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: any }[] = [
    { value: 'light', label: '明亮', icon: Sun },
    { value: 'dark', label: '暗黑', icon: Moon },
    { value: 'eye-care', label: '护眼', icon: Eye },
    { value: 'ocean', label: '海洋', icon: Droplets },
  ];

  if (isCollapsed) {
    return (
      <button
        onClick={() => {
           // Cycle through themes
           const currentIndex = themes.findIndex(t => t.value === theme);
           const nextIndex = (currentIndex + 1) % themes.length;
           setTheme(themes[nextIndex].value);
        }}
        className="flex justify-center p-2 hover:bg-accent rounded-md text-muted-foreground transition-colors w-full"
        title="切换主题"
      >
        <Palette className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="px-2 py-2 border-t border-border/50">
      <div className="text-xs font-medium text-muted-foreground mb-2 px-2">主题切换</div>
      <div className="grid grid-cols-2 gap-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
              theme === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <t.icon className="h-3 w-3" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
