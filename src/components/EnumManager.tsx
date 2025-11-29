import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Database } from 'lucide-react';
import { EnumDefinition, EnumItem } from '../types/rule';
import { useStore } from '../hooks/useStore';

const EnumManager = () => {
  const { enums, saveEnums, loading, error } = useStore();
  const [selectedEnumId, setSelectedEnumId] = useState<string | null>(null);
  const [editingEnum, setEditingEnum] = useState<EnumDefinition | null>(null);

  // Sync editingEnum when selection changes
  useEffect(() => {
    if (selectedEnumId) {
      const found = enums.find(e => e.id === selectedEnumId);
      if (found) {
        setEditingEnum(JSON.parse(JSON.stringify(found))); // Deep copy
      }
    } else {
      setEditingEnum(null);
    }
  }, [selectedEnumId, enums]);

  const handleAddEnum = () => {
    const newEnum: EnumDefinition = {
      id: crypto.randomUUID(),
      name: 'New Enum',
      items: []
    };
    saveEnums([...enums, newEnum]);
    setSelectedEnumId(newEnum.id);
  };

  const handleDeleteEnum = (id: string) => {
    if (confirm('Are you sure you want to delete this enum?')) {
      saveEnums(enums.filter(e => e.id !== id));
      if (selectedEnumId === id) setSelectedEnumId(null);
    }
  };

  const handleSave = () => {
    if (!editingEnum) return;
    const newEnums = enums.map(e => e.id === editingEnum.id ? editingEnum : e);
    saveEnums(newEnums);
    alert('Enum saved successfully');
  };

  const handleAddItem = () => {
    if (!editingEnum) return;
    const newItem: EnumItem = {
      value: 0,
      label: 'New Item'
    };
    setEditingEnum({
      ...editingEnum,
      items: [...editingEnum.items, newItem]
    });
  };

  const handleUpdateItem = (index: number, field: keyof EnumItem, value: any) => {
    if (!editingEnum) return;
    const newItems = [...editingEnum.items];
    
    // If value is changed, handle hex or decimal
    if (field === 'value') {
        // Keep string value in UI if it is being edited, but we should store it as number eventually?
        // Wait, EnumItem.value is defined as number in types/rule.ts
        // If we want to support hex input, we might need to change EnumItem.value to string | number in types
        // OR we just convert here.
        // If user types "0x", parseInt("0x") is NaN.
        // We should probably allow the input to temporarily hold the string, 
        // but we need to cast it properly.
        
        // Actually, for better UX, let's try to parse it.
        // If it starts with 0x, treat as hex.
        // However, if we immediately convert "0x" to NaN or 0, user can't type.
        // So we must allow the UI state to be string, but the underlying model expects number.
        // But here `editingEnum` is of type `EnumDefinition` which has `items: EnumItem[]` where `value: number`.
        // We need to change the type definition of EnumItem to allow string for input, or handle it carefully.
        
        // Let's modify the EnumItem type to allow string temporarily or change how we store it.
        // But wait, the user requirement says: "枚举值的key应该支持以0x开头的16进制值输入,转为结果时应该可以把16进制按照数字比较转换"
        // This implies we can store "0x10" as a string, and at comparison time treat it as 16.
        
        // Let's check types/rule.ts again.
        newItems[index] = { ...newItems[index], [field]: value };
    } else {
        newItems[index] = { ...newItems[index], [field]: value };
    }

    setEditingEnum({ ...editingEnum, items: newItems });
  };

  const handleDeleteItem = (index: number) => {
    if (!editingEnum) return;
    const newItems = editingEnum.items.filter((_, i) => i !== index);
    setEditingEnum({ ...editingEnum, items: newItems });
  };

  if (loading) return <div className="p-4">Loading enums...</div>;

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Sidebar List */}
      <div className="w-64 flex flex-col bg-card border rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            枚举列表
          </h2>
          <button
            onClick={handleAddEnum}
            className="p-1 hover:bg-accent rounded-md"
            title="Add Enum"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {enums.map(e => (
            <div
              key={e.id}
              onClick={() => setSelectedEnumId(e.id)}
              className={`px-3 py-2 rounded-md text-sm cursor-pointer flex justify-between items-center group ${
                selectedEnumId === e.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <span className="truncate">{e.name}</span>
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleDeleteEnum(e.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded ${
                    selectedEnumId === e.id ? 'hover:bg-primary-foreground/20' : ''
                }`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {enums.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-4">
              暂无枚举
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-card border rounded-lg flex flex-col">
        {editingEnum ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <div className="flex gap-4 items-center flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">名称</label>
                  <input
                    className="block w-full bg-background border rounded px-2 py-1 text-sm"
                    value={editingEnum.name}
                    onChange={(e) => setEditingEnum({ ...editingEnum, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">ID</label>
                    <div className="text-xs font-mono text-muted-foreground py-1.5">{editingEnum.id}</div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
              >
                <Save className="h-4 w-4" /> 保存
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">枚举项</h3>
                    <button
                        onClick={handleAddItem}
                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                    >
                        <Plus className="h-3 w-3" /> 添加项
                    </button>
                </div>
                
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground text-left">
                        <tr>
                            <th className="px-3 py-2 w-24">值 (Value)</th>
                            <th className="px-3 py-2 w-48">标签 (Label)</th>
                            <th className="px-3 py-2">描述 (Description)</th>
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {editingEnum.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        placeholder="0 or 0x00"
                                        className="w-full bg-background border rounded px-2 py-1"
                                        value={item.value}
                                        onChange={(e) => handleUpdateItem(idx, 'value', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-background border rounded px-2 py-1"
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full bg-background border rounded px-2 py-1"
                                        value={item.description || ''}
                                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => handleDeleteItem(idx)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                请选择或创建一个枚举
            </div>
        )}
      </div>
    </div>
  );
};

export default EnumManager;
