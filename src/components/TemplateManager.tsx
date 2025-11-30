import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, FileCode, Upload, Download, Target } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { PacketTemplate, ProtocolRule, FieldDefinition, MatchRange } from '../types/rule';
import { PacketGenerator } from '../utils/generator';

const generator = new PacketGenerator();

export const TemplateManager = () => {
  const { rules, templates, saveTemplates, enums, importData, exportData } = useStore();
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
      name: '新建模版',
      protocolId: rules[0]?.id || '',
      values: {}
    };
    saveTemplates([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除此模版?')) {
      saveTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplateId === id) setSelectedTemplateId(null);
    }
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    const newTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    saveTemplates(newTemplates);
    alert('模版已保存');
  };

  const handleImport = async () => {
    if (confirm('导入将合并现有数据 (包含模版和自动回复规则). 继续?')) {
        await importData();
    }
  };

  const handleExport = async () => {
      await exportData();
  };

  const selectedRule = useMemo(() => 
    rules.find(r => r.id === editingTemplate?.protocolId),
    [rules, editingTemplate?.protocolId]
  );

  const generatedHex = useMemo(() => {
    if (!selectedRule || !editingTemplate) return '';
    return generator.generate(selectedRule, editingTemplate.values);
  }, [selectedRule, editingTemplate?.values]);

  // Match Rules Management
  const handleAddMatchRule = () => {
    if (!editingTemplate) return;
    const currentRules = editingTemplate.matchRanges || [];
    // Default to field type if there are fields
    const newRule: MatchRange = selectedRule?.fields[0] 
        ? { type: 'field', fieldId: selectedRule.fields[0].id }
        : { type: 'custom', offset: 0, length: 1, value: '00' };
    
    setEditingTemplate({
        ...editingTemplate,
        matchRanges: [...currentRules, newRule]
    });
  };

  const handleUpdateMatchRule = (index: number, updates: Partial<MatchRange>) => {
    if (!editingTemplate) return;
    const currentRules = [...(editingTemplate.matchRanges || [])];
    currentRules[index] = { ...currentRules[index], ...updates };
    setEditingTemplate({
        ...editingTemplate,
        matchRanges: currentRules
    });
  };

  const handleRemoveMatchRule = (index: number) => {
    if (!editingTemplate) return;
    const currentRules = [...(editingTemplate.matchRanges || [])];
    currentRules.splice(index, 1);
    setEditingTemplate({
        ...editingTemplate,
        matchRanges: currentRules
    });
  };

  const renderFieldInput = (field: FieldDefinition) => {
    if (!editingTemplate) return null;

    const enumDef = field.enumId ? enums.find(e => e.id === field.enumId) : undefined;

    if (enumDef) {
        return (
            <select
                className="w-full border rounded px-2 py-1 text-sm bg-background"
                value={editingTemplate.values[field.id] || ''}
                onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    values: {
                        ...editingTemplate.values,
                        [field.id]: e.target.value
                    }
                })}
            >
                <option value="">选择 {enumDef.name}</option>
                {enumDef.items.map(item => (
                    <option key={item.value} value={item.value}>
                        {item.label} ({item.value})
                    </option>
                ))}
            </select>
        );
    }

    return (
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
            placeholder={field.type === 'array' ? '输入数组元素 (用 ; 分隔)' : `输入 ${field.type} 值...`}
        />
    );
  };

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="w-64 border-r pr-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                模版列表
            </h3>
            <button onClick={handleAdd} className="p-1 hover:bg-accent rounded" title="新建模版">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-1 text-xs border rounded px-2 py-1 hover:bg-accent"
                title="导入模版"
            >
                <Upload className="h-3 w-3" /> 导入
            </button>
            <button 
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1 text-xs border rounded px-2 py-1 hover:bg-accent"
                title="导出模版"
            >
                <Download className="h-3 w-3" /> 导出
            </button>
          </div>
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
                        <Save className="h-3 w-3" /> 保存
                    </button>
                </div>

                <div className="flex flex-col gap-4 overflow-auto flex-1 pr-2">
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">协议</label>
                        <select
                            className="w-full border rounded p-1 text-sm bg-background"
                            value={editingTemplate.protocolId}
                            onChange={(e) => setEditingTemplate({
                                ...editingTemplate, 
                                protocolId: e.target.value,
                                values: {} // Reset values on protocol change
                            })}
                        >
                            <option value="">选择协议</option>
                            {rules.filter(r => r.type === 'custom').map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Match Rules Section */}
                    {selectedRule && (
                        <div className="bg-muted/30 p-3 rounded-md border">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    匹配规则 (特征识别)
                                </h4>
                                <button 
                                    onClick={handleAddMatchRule}
                                    className="text-xs flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
                                >
                                    <Plus className="h-3 w-3" /> 添加规则
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                                配置用于快速识别此模版的特征规则。如果配置了规则，仅当所有规则匹配时才认为识别成功。未配置则使用全量 Hex 匹配。
                            </div>
                            
                            <div className="space-y-2">
                                {(!editingTemplate.matchRanges || editingTemplate.matchRanges.length === 0) && (
                                    <div className="text-xs italic text-muted-foreground p-2 bg-background rounded border text-center">
                                        使用默认全量匹配模式
                                    </div>
                                )}
                                {editingTemplate.matchRanges?.map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded border text-sm">
                                        <select
                                            className="border rounded px-1 py-0.5 text-xs"
                                            value={rule.type}
                                            onChange={(e) => handleUpdateMatchRule(idx, { type: e.target.value as any })}
                                        >
                                            <option value="field">字段匹配</option>
                                            <option value="custom">自定义偏移</option>
                                        </select>

                                        {rule.type === 'field' ? (
                                            <select
                                                className="flex-1 border rounded px-1 py-0.5 text-xs"
                                                value={rule.fieldId || ''}
                                                onChange={(e) => handleUpdateMatchRule(idx, { fieldId: e.target.value })}
                                            >
                                                {selectedRule.fields.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Offset:</span>
                                                    <input
                                                        type="number"
                                                        className="w-12 border rounded px-1 py-0.5 text-xs"
                                                        value={rule.offset || 0}
                                                        onChange={(e) => handleUpdateMatchRule(idx, { offset: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Len:</span>
                                                    <input
                                                        type="number"
                                                        className="w-12 border rounded px-1 py-0.5 text-xs"
                                                        value={rule.length || 1}
                                                        onChange={(e) => handleUpdateMatchRule(idx, { length: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Val(Hex):</span>
                                                    <input
                                                        className="w-20 border rounded px-1 py-0.5 text-xs font-mono"
                                                        value={rule.value || ''}
                                                        placeholder="00 AA"
                                                        onChange={(e) => handleUpdateMatchRule(idx, { value: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <button 
                                            onClick={() => handleRemoveMatchRule(idx)}
                                            className="text-muted-foreground hover:text-destructive p-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedRule && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm border-b pb-1">字段列表</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {selectedRule.fields.map(field => (
                                    <div key={field.id} className="flex flex-col gap-1">
                                        <label className="text-xs font-medium">
                                            {field.name} 
                                            <span className="text-muted-foreground ml-1">
                                                ({field.type}, {field.length} 字节)
                                            </span>
                                        </label>
                                        {renderFieldInput(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-muted p-3 rounded-md">
                    <div className="text-xs font-medium text-muted-foreground mb-1">生成 Hex 预览</div>
                    <div className="font-mono text-sm break-all bg-background p-2 rounded border">
                        {generatedHex || '无数据'}
                    </div>
                </div>
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                请选择或创建模版
            </div>
        )}
      </div>
    </div>
  );
};
