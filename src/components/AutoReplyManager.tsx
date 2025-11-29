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
        setEditingRule(JSON.parse(JSON.stringify(found)));
      }
    } else {
      setEditingRule(null);
    }
  }, [selectedRuleId, replyRules]);

  const handleAdd = () => {
    const newRule: AutoReplyRule = {
      id: crypto.randomUUID(),
      name: 'New Reply Rule',
      isActive: true,
      matchProtocolId: rules[0]?.id || '',
      matchFieldId: '',
      matchValue: '',
      responseTemplateId: templates[0]?.id || ''
    };
    saveReplyRules([...replyRules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this rule?')) {
      saveReplyRules(replyRules.filter(r => r.id !== id));
      if (selectedRuleId === id) setSelectedRuleId(null);
    }
  };

  const handleSave = () => {
    if (!editingRule) return;
    const newRules = replyRules.map(r => r.id === editingRule.id ? editingRule : r);
    saveReplyRules(newRules);
    alert('Rule saved');
  };

  const selectedProtocol = rules.find(r => r.id === editingRule?.matchProtocolId);

  return (
    <div className="flex h-full gap-4">
      {/* List */}
      <div className="w-64 border-r pr-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" /> Auto Reply
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
                <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                    title="Toggle Active"
                 >
                    {editingRule.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                 </button>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
                <Save className="h-3 w-3" /> Save
              </button>
            </div>

            <div className="space-y-4 overflow-auto flex-1 pr-2">
              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Trigger Condition</h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium block mb-1">Protocol</label>
                        <select
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchProtocolId}
                            onChange={(e) => setEditingRule({...editingRule, matchProtocolId: e.target.value, matchFieldId: ''})}
                        >
                            <option value="">Select Protocol</option>
                            {rules.filter(r => r.type === 'custom').map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium block mb-1">Field</label>
                        <select
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchFieldId}
                            onChange={(e) => setEditingRule({...editingRule, matchFieldId: e.target.value})}
                            disabled={!selectedProtocol}
                        >
                            <option value="">Select Field</option>
                            {selectedProtocol?.fields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs font-medium block mb-1">Match Value</label>
                        <input
                            className="w-full border rounded p-2 text-sm bg-background"
                            value={editingRule.matchValue}
                            onChange={(e) => setEditingRule({...editingRule, matchValue: e.target.value})}
                            placeholder="Value to match (e.g., 1, 0x01, 'ping')"
                        />
                    </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Response Action</h4>
                
                <div>
                    <label className="text-xs font-medium block mb-1">Response Template</label>
                    <select
                        className="w-full border rounded p-2 text-sm bg-background"
                        value={editingRule.responseTemplateId}
                        onChange={(e) => setEditingRule({...editingRule, responseTemplateId: e.target.value})}
                    >
                        <option value="">Select Template</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select or create a rule
          </div>
        )}
      </div>
    </div>
  );
};
