import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParserView from '@/components/ParserView';
import * as useStoreHook from '@/hooks/useStore';

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play">Play</span>,
  Trash2: () => <span data-testid="icon-trash">Trash</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
  Save: () => <span data-testid="icon-save">Save</span>,
}));

// Mock sub-components to isolate ParserView logic
vi.mock('@/components/ParsedResultTable', () => ({
  ParsedResultTable: () => <div data-testid="parsed-result-table">Table</div>,
}));
vi.mock('@/components/SampleGeneratorModal', () => ({
  SampleGeneratorModal: () => <div data-testid="sample-generator-modal">Modal</div>,
}));

describe('ParserView', () => {
  const mockSaveRules = vi.fn();
  const mockRules = [
    { id: 'rule1', name: 'Rule 1', type: 'custom', fields: [] }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useStore
    vi.spyOn(useStoreHook, 'useStore').mockReturnValue({
      rules: mockRules,
      enums: [],
      saveRules: mockSaveRules,
      loading: false,
      addRule: vi.fn(),
      updateRule: vi.fn(),
      deleteRule: vi.fn(),
      addEnum: vi.fn(),
      updateEnum: vi.fn(),
      deleteEnum: vi.fn(),
    } as any);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render basic elements', () => {
    render(<ParserView />);
    expect(screen.getByText('协议')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/在此粘贴16进制数据/)).toBeInTheDocument();
    expect(screen.getByText('解析')).toBeInTheDocument();
  });

  it('should copy input content to clipboard', async () => {
    render(<ParserView />);
    const input = screen.getByPlaceholderText(/在此粘贴16进制数据/);
    fireEvent.change(input, { target: { value: '12 34' } });
    
    const copyBtn = screen.getByTitle('复制到剪贴板');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('12 34');
    });
  });

  it('should show save confirmation modal when clicking save', async () => {
    render(<ParserView />);
    const input = screen.getByPlaceholderText(/在此粘贴16进制数据/);
    fireEvent.change(input, { target: { value: '12 34' } });

    // Switch to custom rule (which we mocked as 'rule1')
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'rule1' } });

    // Click save button
    const saveBtn = screen.getByTitle('保存为示例');
    fireEvent.click(saveBtn);

    // Expect modal to appear
    expect(screen.getByText('确认保存')).toBeInTheDocument();
    expect(screen.getByText(/确认覆盖/)).toBeInTheDocument();
  });

  it('should save rule when confirming overwrite', async () => {
    render(<ParserView />);
    const input = screen.getByPlaceholderText(/在此粘贴16进制数据/);
    fireEvent.change(input, { target: { value: '12 34' } });
    
    // Select custom rule
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'rule1' } });

    // Click save -> Open modal
    fireEvent.click(screen.getByTitle('保存为示例'));

    // Click confirm in modal
    fireEvent.click(screen.getByText('确认覆盖'));

    await waitFor(() => {
      expect(mockSaveRules).toHaveBeenCalled();
      const savedRules = mockSaveRules.mock.calls[0][0];
      expect(savedRules[0].sampleHex).toBe('12 34');
    });
  });

  it('should not show save button for built-in protocols', () => {
    render(<ParserView />);
    // Default is often custom_demo or stun depending on implementation, 
    // but let's explicitly select 'stun'
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'stun' } });

    // Save button should not be present for STUN
    expect(screen.queryByTitle('保存为示例')).not.toBeInTheDocument();
  });
});
