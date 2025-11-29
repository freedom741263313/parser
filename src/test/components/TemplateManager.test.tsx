import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateManager } from '../../components/TemplateManager';
import * as useStoreHook from '../../hooks/useStore';

// Mock icons
vi.mock('lucide-react', () => ({
  Plus: () => <span>Plus</span>,
  Trash2: () => <span>Trash2</span>,
  Save: () => <span>Save</span>,
  FileCode: () => <span>FileCode</span>,
  Upload: () => <span>Upload</span>,
  Download: () => <span>Download</span>,
}));

describe('TemplateManager', () => {
  const mockSaveTemplates = vi.fn();
  const mockImportData = vi.fn();
  const mockExportData = vi.fn();

  const mockTemplates = [
      { id: 'tmpl1', name: 'Template 1', protocolId: 'proto1', values: {} }
  ];
  const mockRules = [
      { id: 'proto1', name: 'Protocol 1', type: 'custom', fields: [] }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(useStoreHook, 'useStore').mockReturnValue({
      rules: mockRules,
      templates: mockTemplates,
      saveTemplates: mockSaveTemplates,
      enums: [],
      importData: mockImportData,
      exportData: mockExportData
    } as any);

    // Mock confirm
    window.confirm = vi.fn(() => true);
    // Mock alert
    window.alert = vi.fn();
  });

  it('renders existing templates', () => {
    render(<TemplateManager />);
    expect(screen.getByText('Template 1')).toBeInTheDocument();
  });

  it('calls importData when import button is clicked', async () => {
    render(<TemplateManager />);
    
    const importBtn = screen.getByTitle('导入模版');
    fireEvent.click(importBtn);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockImportData).toHaveBeenCalled();
  });

  it('calls exportData when export button is clicked', async () => {
    render(<TemplateManager />);
    
    const exportBtn = screen.getByTitle('导出模版');
    fireEvent.click(exportBtn);
    
    expect(mockExportData).toHaveBeenCalled();
  });
});
