import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Settings, GripVertical, Download, Upload } from 'lucide-react';
import { ProtocolRule, FieldDefinition, FieldType, Endianness, ParserAlgorithm } from '../types/rule';
import { useStore } from '../hooks/useStore';

const FIELD_TYPES: FieldType[] = ['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64', 'string', 'byte', 'array'];
const ALGORITHMS: ParserAlgorithm[] = ['default', 'longToIp', 'bcd', 'utf8', 'hexStr', 'c_string', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64'];

const RuleManager = () => {
  const { rules, enums, saveRules, loading, importData, exportData } = useStore();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<ProtocolRule | null>(null);

  useEffect(() => {
    if (selectedRuleId) {
      const found = rules.find(r => r.id === selectedRuleId);
      if (found) {
        setEditingRule(JSON.parse(JSON.stringify(found)));
      }
    } else {
      setEditingRule(null);
    }
  }, [selectedRuleId, rules]);

  const handleAddRule = () => {
    const newRule: ProtocolRule = {
      id: crypto.randomUUID(),
      name: 'New Protocol',
      type: 'custom',
      fields: []
    };
    saveRules([...rules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      saveRules(rules.filter(r => r.id !== id));
      if (selectedRuleId === id) setSelectedRuleId(null);
    }
  };

  const handleSave = () => {
    if (!editingRule) return;
    const newRules = rules.map(r => r.id === editingRule.id ? editingRule : r);
    saveRules(newRules);
    alert('Rule saved successfully');
  };

  const handleImport = async () => {
    if (confirm('Importing will merge with existing rules. Continue?')) {
        await importData();
    }
  };

  const handleExport = async () => {
    await exportData();
  };

  const handleAddField = () => {
    if (!editingRule) return;
    const newField: FieldDefinition = {
      id: crypto.randomUUID(),
      name: 'New Field',
      length: 1,
      type: 'uint8',
      endianness: 'be',
      algorithm: 'default'
    };
    setEditingRule({
      ...editingRule,
      fields: [...editingRule.fields, newField]
    });
  };

  const handleUpdateField = (index: number, field: keyof FieldDefinition, value: any) => {
    if (!editingRule) return;
    const newFields = [...editingRule.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    
    // Numeric conversion
    if (field === 'length') {
        newFields[index].length = parseInt(value) || 0;
    }

    setEditingRule({ ...editingRule, fields: newFields });
  };

  const handleDeleteField = (index: number) => {
    if (!editingRule) return;
    const newFields = editingRule.fields.filter((_, i) => i !== index);
    setEditingRule({ ...editingRule, fields: newFields });
  };

  if (loading) return <div className="p-4">Loading rules...</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Sidebar List */}
      <div className="w-64 flex flex-col bg-card border rounded-lg">
        <div className="p-4 border-b flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                规则列表
            </h2>
            <button onClick={handleAddRule} className="p-1 hover:bg-accent rounded-md" title="Add Rule">
                <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-1 text-xs border rounded px-2 py-1 hover:bg-accent"
                title="Import Rules & Enums"
            >
                <Upload className="h-3 w-3" /> 导入
            </button>
            <button 
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1 text-xs border rounded px-2 py-1 hover:bg-accent"
                title="Export Rules & Enums"
            >
                <Download className="h-3 w-3" /> 导出
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {rules.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRuleId(r.id)}
              className={`px-3 py-2 rounded-md text-sm cursor-pointer flex justify-between items-center group ${
                selectedRuleId === r.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <span className="truncate">{r.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteRule(r.id); }}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded ${
                    selectedRuleId === r.id ? 'hover:bg-primary-foreground/20' : ''
                }`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-4">暂无规则</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-card border rounded-lg flex flex-col overflow-hidden">
        {editingRule ? (
          <>
            <div className="p-4 border-b flex flex-col gap-4 bg-muted/30">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">规则编辑</h3>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                        <Save className="h-4 w-4" /> 保存
                    </button>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">协议名称</label>
                        <input
                            className="block w-full bg-background border rounded px-2 py-1 text-sm"
                            value={editingRule.name}
                            onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                        />
                    </div>
                    <div className="w-32 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">类型</label>
                        <select
                            className="block w-full bg-background border rounded px-2 py-1 text-sm"
                            value={editingRule.type}
                            onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as any })}
                        >
                            <option value="custom">Custom</option>
                            <option value="stun">STUN</option>
                            <option value="sip">SIP</option>
                        </select>
                    </div>
                </div>
            </div>

            {editingRule.type === 'custom' ? (
                <div className="flex-1 overflow-auto p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium">字段定义 (Fields)</h4>
                        <button onClick={handleAddField} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Plus className="h-3 w-3" /> 添加字段
                        </button>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">名称</th>
                                    <th className="px-3 py-2 w-20">长度(B)</th>
                                    <th className="px-3 py-2 w-24">类型</th>
                                    <th className="px-3 py-2 w-20">端序</th>
                                    <th className="px-3 py-2 w-24">算法</th>
                                    <th className="px-3 py-2 w-32">枚举/计数关联</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {editingRule.fields.map((field, idx) => (
                                    <tr key={field.id}>
                                        <td className="p-2">
                                            <input
                                                className="w-full bg-background border rounded px-2 py-1"
                                                value={field.name}
                                                onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full bg-background border rounded px-2 py-1"
                                                value={field.length}
                                                onChange={(e) => handleUpdateField(idx, 'length', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                className="w-full bg-background border rounded px-2 py-1"
                                                value={field.type}
                                                onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                                            >
                                                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select
                                                className="w-full bg-background border rounded px-2 py-1"
                                                value={field.endianness}
                                                onChange={(e) => handleUpdateField(idx, 'endianness', e.target.value)}
                                            >
                                                <option value="be">BE</option>
                                                <option value="le">LE</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select
                                                className="w-full bg-background border rounded px-2 py-1"
                                                value={field.algorithm}
                                                onChange={(e) => handleUpdateField(idx, 'algorithm', e.target.value)}
                                            >
                                                {ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            {field.type === 'array' ? (
                                                <select
                                                    className="w-full bg-background border rounded px-2 py-1"
                                                    value={field.countFieldId || ''}
                                                    onChange={(e) => handleUpdateField(idx, 'countFieldId', e.target.value || undefined)}
                                                >
                                                    <option value="">Fixed Length</option>
                                                    {editingRule.fields
                                                        .slice(0, idx)
                                                        .filter(f => ['int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32'].includes(f.type))
                                                        .map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            ) : (
                                                <select
                                                    className="w-full bg-background border rounded px-2 py-1"
                                                    value={field.enumId || ''}
                                                    onChange={(e) => handleUpdateField(idx, 'enumId', e.target.value || undefined)}
                                                >
                                                    <option value="">无</option>
                                                    {enums.map(e => (
                                                        <option key={e.id} value={e.id}>{e.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleDeleteField(idx)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {editingRule.fields.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-xs">
                                点击 "添加字段" 开始定义协议结构
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    内置协议配置暂不可编辑
                </div>
            )}
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                请选择或创建一个规则
            </div>
        )}
      </div>
    </div>
  );
};

export default RuleManager;
