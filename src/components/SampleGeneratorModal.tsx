import React, { useState, useEffect } from 'react';
import { ProtocolRule, FieldDefinition, EnumDefinition } from '../types/rule';
import { X, Save, Wand2 } from 'lucide-react';

interface Props {
  rule: ProtocolRule;
  enums: EnumDefinition[];
  onClose: () => void;
  onGenerate: (values: Record<string, any>) => void;
}

export const SampleGeneratorModal: React.FC<Props> = ({ rule, enums, onClose, onGenerate }) => {
  const [values, setValues] = useState<Record<string, any>>({});

  // Initialize default values
  useEffect(() => {
    const defaults: Record<string, any> = {};
    rule.fields.forEach(f => {
      defaults[f.id] = '';
      if (f.type === 'string') defaults[f.id] = '';
      if (f.type.includes('int')) defaults[f.id] = 0;
      if (f.enumId) {
          const enumDef = enums.find(e => e.id === f.enumId);
          if (enumDef && enumDef.items.length > 0) {
              defaults[f.id] = enumDef.items[0].value;
          }
      }
    });
    setValues(defaults);
  }, [rule, enums]);

  const handleChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderInput = (field: FieldDefinition) => {
    // Enum Select
    if (field.enumId) {
        const enumDef = enums.find(e => e.id === field.enumId);
        if (enumDef) {
            return (
                <select
                    className="w-full bg-background border rounded px-2 py-1 text-sm"
                    value={values[field.id]}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                >
                    {enumDef.items.map((item, idx) => (
                        <option key={idx} value={item.value}>
                            {item.label} ({item.value})
                        </option>
                    ))}
                </select>
            );
        }
    }

    // Numeric Input
    if (field.type.includes('int') && field.type !== 'int64' && field.type !== 'uint64') {
        return (
            <input
                type="number"
                className="w-full bg-background border rounded px-2 py-1 text-sm"
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, Number(e.target.value))}
            />
        );
    }

    // BigInt Input (Text)
    if (field.type === 'int64' || field.type === 'uint64') {
        return (
            <input
                type="text"
                placeholder="输入大整数"
                className="w-full bg-background border rounded px-2 py-1 text-sm"
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
            />
        );
    }

    // String Input
    if (field.type === 'string') {
        return (
            <input
                type="text"
                maxLength={field.length}
                className="w-full bg-background border rounded px-2 py-1 text-sm"
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder="请输入文本"
            />
        );
    }

    // Array Input
    if (field.type === 'array') {
        return (
            <input
                type="text"
                placeholder="值1;值2;值3 (使用分号分隔)"
                className="w-full bg-background border rounded px-2 py-1 text-sm"
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
            />
        );
    }

    // Default/Hex Input
    return (
        <input
            type="text"
            placeholder="请输入十六进制或数值"
            className="w-full bg-background border rounded px-2 py-1 text-sm"
            value={values[field.id]}
            onChange={(e) => handleChange(field.id, e.target.value)}
        />
    );
  };

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border shadow-lg rounded-lg flex flex-col w-full max-w-2xl max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                生成样本: {rule.name}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-accent rounded">
                <X className="w-4 h-4" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rule.fields.map(field => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                        <label className="text-sm font-medium block truncate" title={field.name}>{field.name}</label>
                        <span className="text-xs text-muted-foreground">{field.type} ({field.length}B)</span>
                    </div>
                    <div className="col-span-8">
                        {renderInput(field)}
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md hover:bg-accent border">
                取消
            </button>
            <button 
                onClick={() => onGenerate(values)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                生成并保存
            </button>
        </div>
      </div>
    </div>
  );
};
