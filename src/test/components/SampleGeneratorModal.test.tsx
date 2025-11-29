import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SampleGeneratorModal } from '@/components/SampleGeneratorModal';
import { ProtocolRule } from '@/types/rule';

describe('SampleGeneratorModal', () => {
  const mockRule: ProtocolRule = {
    id: 'test',
    name: 'Test Protocol',
    type: 'custom',
    fields: [
      { id: 'f1', name: 'Field 1', length: 1, type: 'uint8', endianness: 'be', algorithm: 'default' },
      { id: 'f2', name: 'Field 2', length: 4, type: 'string', endianness: 'be', algorithm: 'default' }
    ]
  };

  const defaultProps = {
    rule: mockRule,
    enums: [],
    onClose: vi.fn(),
    onGenerate: vi.fn(),
  };

  it('should select all text when number input is focused', () => {
    render(<SampleGeneratorModal {...defaultProps} />);
    
    // Find the input for Field 1 (uint8 -> number input)
    // Since we don't have easy IDs, we might find by type or label if available.
    // The component likely renders labels with field names.
    
    // Let's look at how the inputs are rendered. 
    // Assuming label contains "Field 1" and input is nearby or associated.
    // If not associated, we might need to query by type="number"
    
    // Instead of getByTestId, let's use getAllByRole which is more reliable here
    const inputs = screen.getAllByRole('spinbutton');
    const numberInput = inputs[0];
    
    // Simulate focus
    fireEvent.focus(numberInput);
    
    // Check if select was called
    // Since e.target.select() is called in the handler, and jsdom implements HTMLInputElement,
    // but select() might not be mocked by default or observable without a spy on the element method.
    // However, we can just verify the handler is attached and runs without error for now, 
    // or try to spy on HTMLInputElement.prototype.select
  });

  it('should call select on focus for number inputs', () => {
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select');
    render(<SampleGeneratorModal {...defaultProps} />);
    
    // We need to find the number input. Based on mockRule, 'f1' is uint8 (numeric)
    // The inputs are rendered in order. 
    // Let's find all inputs
    const inputs = screen.getAllByRole('spinbutton'); // type="number" has role spinbutton
    const numberInput = inputs[0];
    
    fireEvent.focus(numberInput);
    
    expect(selectSpy).toHaveBeenCalled();
    selectSpy.mockRestore();
  });
});
