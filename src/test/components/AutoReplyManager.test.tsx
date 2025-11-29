import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoReplyManager } from '../../components/AutoReplyManager';
import * as useStoreHook from '../../hooks/useStore';

// Mock icons
vi.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Trash2: () => <span>Trash2</span>,
  Save: () => <span>Save</span>,
  Zap: () => <span>Zap</span>,
  ToggleLeft: () => <span>ToggleLeft</span>,
  ToggleRight: () => <span>ToggleRight</span>,
}));

describe('AutoReplyManager', () => {
  const mockSaveReplyRules = vi.fn();
  const mockReplyRules = [
    { 
        id: 'rule1', 
        name: 'Rule 1', 
        isActive: true, 
        matchProtocolId: 'proto1', 
        matchFieldId: 'field1', 
        matchValue: '1', 
        actions: [] 
    }
  ];
  const mockTemplates = [
      { id: 'tmpl1', name: 'Template 1', protocolId: 'proto1', values: {} }
  ];
  const mockRules = [
      { id: 'proto1', name: 'Protocol 1', type: 'custom', fields: [{ id: 'field1', name: 'Field 1', type: 'uint8', length: 1, algorithm: 'default', endianness: 'be' }] }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
    
    vi.spyOn(useStoreHook, 'useStore').mockReturnValue({
      rules: mockRules,
      templates: mockTemplates,
      replyRules: mockReplyRules,
      saveReplyRules: mockSaveReplyRules,
      enums: []
    } as any);
  });

  it('renders existing rules', () => {
    render(<AutoReplyManager />);
    expect(screen.getByText('Rule 1')).toBeInTheDocument();
  });

  it('allows adding actions and saving', () => {
    render(<AutoReplyManager />);
    
    // Select rule
    fireEvent.click(screen.getByText('Rule 1'));
    
    // Click add action
    fireEvent.click(screen.getByText('添加动作'));
    
    // Set delay
    const delayInput = screen.getByPlaceholderText('延迟(ms)');
    fireEvent.change(delayInput, { target: { value: '1000' } });
    
    // Save
    fireEvent.click(screen.getByText('保存'));
    
    expect(mockSaveReplyRules).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
            id: 'rule1',
            actions: expect.arrayContaining([
                expect.objectContaining({ delay: 1000 })
            ])
        })
    ]));
  });
});
