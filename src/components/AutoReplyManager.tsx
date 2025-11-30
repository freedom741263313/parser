import React, { useState } from 'react';
import { Plus, Trash2, Save, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { AutoReplyRule } from '../types/rule';

export const AutoReplyManager = () => {
  const { rules, templates, replyRules, saveReplyRules } = useStore();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);

  React.useEffect(() => {
    if (selectedRuleId) {
      const found = replyRules.find(r => r.id === selectedRuleId);
      if (found) {
        const rule = JSON.parse(JSON.stringify(found));
        // Migration for old rules
        if (!rule.actions) {
            // @ts-ignore - responseTemplateId might exist on old objects
            rule.actions = rule.responseTemplateId 
                // @ts-ignore
                ? [{ templateId: rule.responseTemplateId, delay: 0 }]
                : [];
        }
        setEditingRule(rule);
      }
    } else {
      setEditingRule(null);
    }
  }, [selectedRuleId, replyRules]);

  const handleAdd = () => {
    const newRule: AutoReplyRule = {
      id: crypto.randomUUID(),
      name: '新建回复规则',
      isActive: true,
      matchProtocolId: rules[0]?.id || '',
      matchFieldId: '',
      matchValue: '',
      actions: []
    };
    saveReplyRules([...replyRules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除此规则?')) {
      saveReplyRules(replyRules.filter(r => r.id !== id));
      if (selectedRuleId === id) setSelectedRuleId(null);
    }
  };

  const handleSave = () => {
    if (!editingRule) return;
    const newRules = replyRules.map(r => r.id === editingRule.id ? editingRule : r);
    saveReplyRules(newRules);
    alert('规则已保存');
  };

  const handleAddAction = () => {
      if (!editingRule) return;
      setEditingRule({
          ...editingRule,
          actions: [
              ...editingRule.actions,
              { templateId: templates[0]?.id || '', delay: 0 }
          ]
      });
  };

  const handleUpdateAction = (index: number, field: 'templateId' | 'delay', value: any) => {
      if (!editingRule) return;
      const newActions = [...editingRule.actions];
      newActions[index] = { ...newActions[index], [field]: value };
      setEditingRule({ ...editingRule, actions: newActions });
  };

  const handleDeleteAction = (index: number) => {
      if (!editingRule) return;
      const newActions = editingRule.actions.filter((_, i) => i !== index);
      setEditingRule({ ...editingRule, actions: newActions });
  };

  const selectedProtocol = rules.find(r => r.id === editingRule?.matchProtocolId);

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="w-64 border-r pr-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" /> 自动回复
          </h3>
          <button onClick={handleAdd} className="p-1 hover:bg-accent rounded">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto space-y-1">
          {replyRules.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRuleId(r.id)}
              className={`p-2 rounded cursor-pointer flex justify-between items-center group ${
                selectedRuleId === r.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-green-500' : 'bg-muted'}`} />
                <span className="truncate text-sm">{r.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
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
        {editingRule ? (
          <>
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-4">
                 <input
                    className="font-bold bg-transparent border-none outline-none"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                 />
                 <button 
                    onClick={() => setEditingRule({...editingRule, isActive: !editingRule.isActive})}
                    className="text-muted-foreground hover:text-foreground"
                    title="切换激活状态"
                 >
                    {editingRule.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                 </button>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                <Save className="h-3 w-3" /> 保存
              </button>
            </div>

            <div className="space-y-4 overflow-auto flex-1 pr-2">
              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">触发条件</h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">协议</label>
                        <select
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchProtocolId}
                            onChange={(e) => setEditingRule({...editingRule, matchProtocolId: e.target.value, matchFieldId: ''})}
                        >
                            <option value="">选择协议</option>
                            {rules.filter(r => r.type === 'custom').map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium block mb-1">字段</label>
                        <select
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchFieldId}
                            onChange={(e) => setEditingRule({...editingRule, matchFieldId: e.target.value})}
                            disabled={!selectedProtocol}
                        >
                            <option value="">选择字段</option>
                            {selectedProtocol?.fields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs font-medium block mb-1">匹配值</label>
                        <input
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchValue}
                            onChange={(e) => setEditingRule({...editingRule, matchValue: e.target.value})}
                            placeholder="匹配值 (如 1, 0x01, 'ping')"
                        />
                    </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">响应动作</h4>
                    <button onClick={handleAddAction} className="p-1 hover:bg-primary/10 rounded text-primary flex items-center gap-1 text-xs">
                        <Plus className="h-3 w-3" /> 添加动作
                    </button>
                </div>
                
                <div className="space-y-2">
                    {editingRule.actions.map((action, index) => (
                        <div key={index} className="flex gap-2 items-center bg-background p-2 rounded border">
                            <div className="flex-1">
                                <select
                                    className="w-full border rounded p-1 text-sm bg-background"
                                    value={action.templateId}
                                    onChange={(e) => handleUpdateAction(index, 'templateId', e.target.value)}
                                >
                                    <option value="">选择模版</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    className="w-full border rounded p-1 text-sm bg-background"
                                    value={action.delay}
                                    onChange={(e) => handleUpdateAction(index, 'delay', parseInt(e.target.value) || 0)}
                                    placeholder="延迟(ms)"
                                    title="延迟时间 (毫秒)"
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">ms</span>
                            <button 
                                onClick={() => handleDeleteAction(index)}
                                className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {editingRule.actions.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-4">
                            无响应动作, 请点击上方添加
                        </div>
                    )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            请选择或创建规则
          </div>
        )}
      </div>
    </div>
  );
};
