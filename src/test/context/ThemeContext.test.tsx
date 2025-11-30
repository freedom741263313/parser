import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const TestComponent = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      {availableThemes.map(t => (
        <button key={t.id} onClick={() => setTheme(t.id)}>
          Set {t.name}
        </button>
      ))}
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default theme (violet)', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('violet');
    expect(document.documentElement).toHaveClass('theme-violet');
    expect(document.documentElement.getAttribute('data-theme')).toBe('violet');
  });

  it('loads theme from localStorage', () => {
    localStorage.setItem('app-theme', 'ocean');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('ocean');
    expect(document.documentElement).toHaveClass('theme-ocean');
  });

  it('updates theme and localStorage when changed', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const button = screen.getByText('Set 深海蓝'); // Ocean theme name
    fireEvent.click(button);

    expect(screen.getByTestId('current-theme')).toHaveTextContent('ocean');
    expect(localStorage.getItem('app-theme')).toBe('ocean');
    expect(document.documentElement).toHaveClass('theme-ocean');
    expect(document.documentElement).not.toHaveClass('theme-violet');
  });
});
