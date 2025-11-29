import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Sidebar', () => {
  it('toggles sidebar collapse state', () => {
    render(<App />);

    // Initial state: Sidebar should be expanded
    // "UDP Parser" title should be visible
    expect(screen.getByText('UDP Parser')).toBeInTheDocument();
    
    // Find the toggle button (we will add aria-label="Toggle Sidebar")
    // Note: Since we haven't implemented it yet, this test will fail if run now.
    // But we are writing TDD style (or close to it).
    // However, since I can't run the test without the code existing (it would just fail compilation or finding element),
    // I will write the test assuming the implementation details I plan.
    
    const toggleBtn = screen.getByLabelText('Toggle Sidebar');
    expect(toggleBtn).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleBtn);

    // Check if sidebar width changed (we can check class names or style, but class is easier here)
    // Finding the sidebar container might need a testid
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('w-16');
    expect(sidebar).not.toHaveClass('w-64');

    // "UDP Parser" text should be hidden or removed. 
    // If we remove it from DOM:
    // expect(screen.queryByText('UDP Parser')).not.toBeInTheDocument(); 
    // Or if we just hide it with CSS, that's harder to test with standard matchers unless we check visibility.
    // Let's assume we remove it or it becomes hidden.

    // Click to expand
    fireEvent.click(toggleBtn);
    
    // Check if sidebar width returned
    expect(sidebar).toHaveClass('w-64');
  });
});
