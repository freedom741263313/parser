import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, FileCode } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { PacketTemplate, ProtocolRule } from '../types/rule';
import { PacketGenerator } from '../utils/generator';

const generator = new PacketGenerator();

export const TemplateManager = () => {
  const { rules, templates, saveTemplates } = useStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PacketTemplate | null>(null);

  // Initialize editing state when selection changes
  React.useEffect(() => {
    if (selectedTemplateId) {
      const found = templates.find(t => t.id === selectedTemplateId);
      if (found) {
        setEditingTemplate(JSON.parse(JSON.stringify(found)));
      }
    } else {
      setEditingTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  const handleAdd = () => {
    const newTemplate: PacketTemplate = {
      id: crypto.randomUUID(),
      name: 'New Template',
      protocolId: rules[0]?.id || '',
      values: {}
    };
    saveTemplates([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this template?')) {
      saveTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplateId === id) setSelectedTemplateId(null);
    }
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    const newTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    saveTemplates(newTemplates);
    alert('Template saved');
  };

  const selectedRule = useMemo(() => 
    rules.find(r => r.id === editingTemplate?.protocolId),
    [rules, editingTemplate?.protocolId]
  );

  const generatedHex = useMemo(() => {
    if (!selectedRule || !editingTemplate) return '';
    return generator.generate(selectedRule, editingTemplate.values);
  }, [selectedRule, editingTemplate?.values]);

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="w-64 border-r pr-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Templates</h3>
          <button onClick={handleAdd} className="p-1 hover:bg-accent rounded">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto space-y-1">
            {templates.map(t => (
                <div
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`p-2 rounded cursor-pointer flex justify-between group ${
                        selectedTemplateId === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                >
                    <span className="truncate">{t.name}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 p-1 rounded"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {editingTemplate ? (
            <>
                <div className="flex justify-between items-center border-b pb-2">
                    <input
                        className="font-bold bg-transparent border-none outline-none"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    />
                    <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                        <Save className="h-3 w-3" /> Save
                    </button>
                </div>

                <div className="flex flex-col gap-4 overflow-auto flex-1 pr-2">
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">Protocol</label>
                        <select
                            className="w-full border rounded p-1 text-sm bg-background"
                            value={editingTemplate.protocolId}
                            onChange={(e) => setEditingTemplate({
                                ...editingTemplate, 
                                protocolId: e.target.value,
                                values: {} // Reset values on protocol change
                            })}
                        >
                            <option value="">Select Protocol</option>
                            {rules.filter(r => r.type === 'custom').map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedRule && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm border-b pb-1">Fields</h4>
                            {selectedRule.fields.map(field => (
                                <div key={field.id} className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">
                                        {field.name} 
                                        <span className="text-muted-foreground ml-1">
                                            ({field.type}, {field.length} bytes)
                                        </span>
                                    </label>
                                    <input
                                        className="border rounded px-2 py-1 text-sm bg-background"
                                        value={editingTemplate.values[field.id] || ''}
                                        onChange={(e) => setEditingTemplate({
                                            ...editingTemplate,
                                            values: {
                                                ...editingTemplate.values,
                                                [field.id]: e.target.value
                                            }
                                        })}
                                        placeholder={`Enter ${field.type} value...`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-muted p-3 rounded-md">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Generated Hex Preview</div>
                    <div className="font-mono text-sm break-all bg-background p-2 rounded border">
                        {generatedHex || 'No data'}
                    </div>
                </div>
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select or create a template
            </div>
        )}
      </div>
    </div>
  );
};
