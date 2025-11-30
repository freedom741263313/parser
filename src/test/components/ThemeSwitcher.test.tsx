import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ThemeSelector } from '../../components/ThemeSelector';
import React from 'react';

describe('Theme System', () => {
  beforeEach(() => {
    // Clear local storage and reset class list
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders theme selector buttons', () => {
    render(
      <ThemeProvider>
        <ThemeSelector isCollapsed={false} />
      </ThemeProvider>
    );

    expect(screen.getByText('明亮')).toBeDefined();
    expect(screen.getByText('暗黑')).toBeDefined();
    expect(screen.getByText('护眼')).toBeDefined();
    expect(screen.getByText('海洋')).toBeDefined();
  });

  it('switches theme on click and persists to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeSelector isCollapsed={false} />
      </ThemeProvider>
    );

    // Default is light
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Switch to dark
    fireEvent.click(screen.getByText('暗黑'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('app-theme')).toBe('dark');

    // Switch to eye-care
    fireEvent.click(screen.getByText('护眼'));
    expect(document.documentElement.classList.contains('theme-eye-care')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('app-theme')).toBe('eye-care');
    
    // Switch to ocean
    fireEvent.click(screen.getByText('海洋'));
    expect(document.documentElement.classList.contains('theme-ocean')).toBe(true);
    expect(document.documentElement.classList.contains('theme-eye-care')).toBe(false);
    expect(localStorage.getItem('app-theme')).toBe('ocean');
  });

  it('handles collapsed state', () => {
    render(
      <ThemeProvider>
        <ThemeSelector isCollapsed={true} />
      </ThemeProvider>
    );

    // Should show a single button (Palette icon)
    const button = screen.getByTitle('切换主题');
    expect(button).toBeDefined();

    // Initial state
    expect(localStorage.getItem('app-theme') || 'light').toBe('light');

    // Click to cycle (light -> dark)
    fireEvent.click(button);
    expect(localStorage.getItem('app-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
