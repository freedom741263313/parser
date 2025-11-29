import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock the sub-components to avoid complex rendering and store dependencies
// We only care about their existence and visibility controlled by MainLayout
vi.mock('../components/ParserView', () => ({
  default: () => <div data-testid="parser-view">Parser Content <input data-testid="parser-input" /></div>
}));
vi.mock('../components/UdpDebugger', () => ({
  default: () => <div data-testid="udp-view">UDP Debugger Content</div>
}));
vi.mock('../components/RuleManager', () => ({
  default: () => <div data-testid="rule-view">Rule Manager Content</div>
}));
vi.mock('../components/EnumManager', () => ({
  default: () => <div data-testid="enum-view">Enum Manager Content</div>
}));

describe('Navigation State Persistence', () => {
  it('renders all views and toggles visibility', () => {
    render(<App />);

    // Check all views exist in the DOM
    const parserView = screen.getByTestId('parser-view');
    const udpView = screen.getByTestId('udp-view');
    const ruleView = screen.getByTestId('rule-view');
    const enumView = screen.getByTestId('enum-view');

    expect(parserView).toBeInTheDocument();
    expect(udpView).toBeInTheDocument();
    expect(ruleView).toBeInTheDocument();
    expect(enumView).toBeInTheDocument();

    // Initial state: Parser View visible (root path)
    // Note: In JSDOM/React Testing Library, we check the parent div's style
    expect(parserView.parentElement).toHaveStyle({ display: 'block' });
    expect(udpView.parentElement).toHaveStyle({ display: 'none' });

    // Click UDP Debugger Link
    const udpLink = screen.getByText('UDP 调试');
    fireEvent.click(udpLink);

    // Now UDP View should be visible, Parser View hidden
    expect(parserView.parentElement).toHaveStyle({ display: 'none' });
    expect(udpView.parentElement).toHaveStyle({ display: 'block' });
  });

  it('preserves input state when switching tabs', () => {
    render(<App />);

    // Type something in Parser View
    const input = screen.getByTestId('parser-input');
    fireEvent.change(input, { target: { value: 'test-persistence' } });
    expect(input).toHaveValue('test-persistence');

    // Switch to UDP Debugger
    fireEvent.click(screen.getByText('UDP 调试'));
    
    // Switch back to Parser
    fireEvent.click(screen.getByText('解析器'));

    // Input should still have the value
    expect(input).toHaveValue('test-persistence');
  });
});
