import React, { useState, useMemo } from 'react';
import { ProtocolType, ParsedField, ProtocolRule } from '../types/rule';
import { formatHex, cleanHex, hexToBuffer } from '../utils/hex';
import { parseStun } from '../utils/protocols/stun';
import { ParserEngine } from '../utils/parser';
import { useStore } from '../hooks/useStore';
import { ParsedResultTable } from './ParsedResultTable';
import { Play, Trash2, Copy, Save } from 'lucide-react';

import { PacketBuilder } from '../utils/builder';
import { SampleGeneratorModal } from './SampleGeneratorModal';

const SAMPLE_STUN_HEX = "00 01 00 58 21 12 A4 42 B7 E7 A7 01 BC 34 D6 86 FA 87 DF AE 80 22 00 0B 53 54 55 4E 20 74 65 73 74 20 63 6C 69 65 6E 74 00 00 00 20 00 08 00 01 2E 4F 13 35 00 06 00 09 65 76 6F 6C 75 74 69 6F 6E 20 00 00 00 08 00 14 29 05 65 B1 91 79 D0 42 6F 92 80 28 00 04 6D 33 7D 0D";

const ParserView = () => {
  const { rules, enums, saveRules, loading } = useStore();
  const [inputHex, setInputHex] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('custom_demo');
  const [parsedResults, setParsedResults] = useState<ParsedField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSampleInput, setShowSampleInput] = useState(false);
  const [sampleInputVal, setSampleInputVal] = useState('');
  
  // New states for Sample Generation
  const [showGenerator, setShowGenerator] = useState(false);
  const [showLoadOption, setShowLoadOption] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Auto-select first user rule when loaded
  React.useEffect(() => {
    if (!loading && rules.length > 0 && selectedProtocolId === 'custom_demo') {
      setSelectedProtocolId(rules[0].id);
    }
  }, [loading, rules]);

  // Mock Custom Rule for demo
  const mockRule: ProtocolRule = useMemo(() => ({
    id: 'custom_demo',
    name: 'Demo Protocol',
    type: 'custom',
    fields: [
      { id: 'f1', name: 'Header', length: 2, type: 'uint16', endianness: 'be', algorithm: 'default' },
      { id: 'f2', name: 'Version', length: 1, type: 'uint8', endianness: 'be', algorithm: 'default' },
      { id: 'f3', name: 'Command', length: 1, type: 'uint8', endianness: 'be', algorithm: 'default' },
      { id: 'f4', name: 'Payload', length: 4, type: 'string', endianness: 'be', algorithm: 'default' },
    ]
  }), []);

  // Combine static mock rules with dynamic store rules
  const availableRules = useMemo(() => {
      const staticRules: ProtocolRule[] = [
          mockRule,
          { id: 'stun', name: 'STUN (RFC 5389)', type: 'stun', fields: [] },
          { id: 'sip', name: 'SIP (RFC 3261)', type: 'sip', fields: [] }
      ];
      return [...staticRules, ...rules];
  }, [rules, mockRule]);

  const currentRule = useMemo(() => 
      availableRules.find(r => r.id === selectedProtocolId) || mockRule
  , [availableRules, selectedProtocolId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Auto format logic could go here, but let's keep it simple for now
    setInputHex(val);
  };

  const handleFormat = () => {
    setInputHex(formatHex(inputHex));
  };

  const handleParse = () => {
    setError(null);
    try {
      const buffer = hexToBuffer(inputHex);
      
      let results: ParsedField[] = [];
      
      if (currentRule.type === 'stun') {
        results = parseStun(buffer);
      } else if (currentRule.type === 'custom') {
        const engine = new ParserEngine(enums);
        results = engine.parse(buffer, currentRule);
      } else {
        setError('Protocol not implemented yet');
        return;
      }
      
      setParsedResults(results);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadSample = async () => {
    // 1. Use saved sample if available - SHOW OPTIONS
    if (currentRule.sampleHex) {
        setShowLoadOption(true);
        return;
    }

    // 2. Fallback for built-in static rules
    if (currentRule.id === 'stun') {
      setInputHex(SAMPLE_STUN_HEX);
      return;
    }
    if (currentRule.id === 'custom_demo') {
      setInputHex("12 34 01 02 54 45 53 54"); // Matches mockRule
      return;
    }

    // 3. For user defined rules without sample, OPEN GENERATOR
    const isUserRule = rules.some(r => r.id === currentRule.id);
    if (isUserRule) {
        setShowGenerator(true);
    } else {
        // Fallback for other static rules (e.g. SIP if not handled)
        setError("No sample available for this protocol.");
    }
  };

  const handleUseSavedSample = () => {
      if (currentRule.sampleHex) {
          setInputHex(currentRule.sampleHex);
      }
      setShowLoadOption(false);
  };

  const handleOpenGenerator = () => {
      setShowLoadOption(false);
      setShowGenerator(true);
  };

  const handleGeneratedSample = async (values: Record<string, any>) => {
      try {
          const hex = PacketBuilder.build(currentRule, values);
          setInputHex(hex);
          setShowGenerator(false);

          // Save to store
          const updatedRules = rules.map(r => 
              r.id === currentRule.id ? { ...r, sampleHex: hex } : r
          );
          await saveRules(updatedRules);

          // Auto parse is triggered by user clicking Parse, or we can do it here?
          // Requirement says "auto parse"
          setTimeout(() => {
              // We can't easily call handleParse directly if it depends on state update of inputHex
              // But inputHex update is async. 
              // Let's just let the user click Parse or we use useEffect on inputHex? 
              // No, useEffect on inputHex might be annoying if typing.
              // We can call parse logic directly with the new hex
              doParse(hex);
          }, 100);

      } catch (e) {
          console.error('Failed to generate sample:', e);
          setError('Failed to generate sample');
      }
  };

  const doParse = (hex: string) => {
      setError(null);
      try {
        const buffer = hexToBuffer(hex);
        let results: ParsedField[] = [];
        
        if (currentRule.type === 'stun') {
          results = parseStun(buffer);
        } else if (currentRule.type === 'custom') {
          const engine = new ParserEngine(enums);
          results = engine.parse(buffer, currentRule);
        }
        setParsedResults(results);
      } catch (err: any) {
        setError(err.message);
      }
  };

  const handleSaveSample = async () => {
    // If called from Modal, use sampleInputVal
    // If called from Save Button (showSaveConfirm), use inputHex
    const hexToSave = showSaveConfirm ? inputHex : sampleInputVal;

    if (!hexToSave.trim()) {
        setShowSampleInput(false);
        setShowSaveConfirm(false);
        return;
    }
    const formatted = formatHex(hexToSave);
    
    // Only update inputHex if saving from Modal
    if (!showSaveConfirm) {
        setInputHex(formatted);
    }
    
    setShowSampleInput(false);
    setShowSaveConfirm(false);
    
    try {
        const updatedRules = rules.map(r => 
            r.id === currentRule.id ? { ...r, sampleHex: formatted } : r
        );
        await saveRules(updatedRules);
    } catch (e) {
        console.error('Failed to save sample:', e);
        setError('Failed to save sample to rule');
    }
  };

  const handleCopy = async () => {
      if (!inputHex) return;
      try {
          await navigator.clipboard.writeText(inputHex);
          // Optional: Show toast? For now just simple
      } catch (err) {
          console.error('Failed to copy:', err);
      }
  };

  const handleSaveBtnClick = () => {
      if (!inputHex.trim()) return;
      setShowSaveConfirm(true);
  };

  return (
    <div className="relative flex h-full flex-col p-4 gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-md border">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">协议</label>
          <select 
            className="h-8 rounded-md border bg-background px-3 text-sm min-w-[200px]"
            value={selectedProtocolId}
            onChange={(e) => setSelectedProtocolId(e.target.value)}
          >
            <optgroup label="内置/演示">
                <option value="custom_demo">演示协议</option>
                <option value="stun">STUN (RFC 5389)</option>
                <option value="sip">SIP (RFC 3261)</option>
            </optgroup>
            {rules.length > 0 && (
                <optgroup label="自定义规则">
                    {rules.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </optgroup>
            )}
          </select>
        </div>

        <div className="flex-1" />

        <button 
          onClick={loadSample}
          className="text-xs text-primary hover:underline"
        >
          加载示例
        </button>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Input Area */}
        <div className="w-1/2 flex flex-col gap-2">
          <div className="flex justify-between items-center h-8">
            <h3 className="font-semibold text-sm">输入</h3>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="p-1 hover:bg-accent rounded" title="复制到剪贴板">
                <Copy className="w-4 h-4" />
              </button>
              {/* Only show Save for custom user rules, not static ones */}
              {rules.some(r => r.id === currentRule.id) && (
                <button onClick={handleSaveBtnClick} className="p-1 hover:bg-accent rounded" title="保存为示例">
                  <Save className="w-4 h-4" />
                </button>
              )}
              <div className="w-px bg-border mx-1"></div>
              <button onClick={handleFormat} className="p-1 hover:bg-accent rounded" title="格式化">
                <span className="text-xs font-mono">格式化</span>
              </button>
              <button onClick={() => setInputHex('')} className="p-1 hover:bg-destructive/10 text-destructive rounded" title="清空">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            className="flex-1 resize-none p-4 font-mono text-sm border rounded-md focus:ring-2 focus:ring-primary outline-none"
            placeholder="在此粘贴16进制数据 (例如 45 00 00 1C ...)"
            value={inputHex}
            onChange={handleInputChange}
          />
          <button 
            onClick={handleParse}
            className="bg-primary text-primary-foreground h-10 rounded-md flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" />
            解析
          </button>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
              错误: {error}
            </div>
          )}
        </div>

        {/* Result Area */}
        <div className="w-1/2 flex flex-col gap-2">
          <div className="flex justify-between items-center h-8">
            <h3 className="font-semibold text-sm">解析结果</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {parsedResults.length > 0 ? (
              <ParsedResultTable data={parsedResults} />
            ) : (
              <div className="h-full border rounded-md flex items-center justify-center text-muted-foreground text-sm bg-secondary/10">
                等待解析...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Input Modal */}
      {showSampleInput && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border shadow-lg rounded-lg p-6 w-[400px] space-y-4">
            <h3 className="font-semibold">保存十六进制示例</h3>
            <p className="text-sm text-muted-foreground">
              请输入"{currentRule.name}"的示例数据，它将被保存以供将来使用。
            </p>
            <textarea
              className="w-full h-32 bg-background border rounded-md p-2 text-sm font-mono resize-none focus:ring-2 focus:ring-primary outline-none"
              placeholder="例如 00 01 02 ..."
              value={sampleInputVal}
              onChange={(e) => setSampleInputVal(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSampleInput(false)}
                className="px-3 py-1 text-sm rounded-md hover:bg-accent border"
              >
                取消
              </button>
              <button
                onClick={handleSaveSample}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                保存并加载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Option Modal */}
      {showLoadOption && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border shadow-lg rounded-lg p-6 w-[400px] space-y-4">
            <h3 className="font-semibold">加载示例</h3>
            <p className="text-sm text-muted-foreground">
              检测到该协议已存在保存的示例，您希望？
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleUseSavedSample}
                className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-2"
              >
                使用保存的示例
              </button>
              <button
                onClick={handleOpenGenerator}
                className="w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center justify-center gap-2"
              >
                生成新示例
              </button>
              <button
                onClick={() => setShowLoadOption(false)}
                className="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md mt-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border shadow-lg rounded-lg p-6 w-[400px] space-y-4">
            <h3 className="font-semibold">确认保存</h3>
            <p className="text-sm text-muted-foreground">
              您确定要将当前输入框中的内容保存为协议 "{currentRule.name}" 的默认示例吗？
              <br/>
              这将会覆盖之前的示例。
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="px-3 py-1 text-sm rounded-md hover:bg-accent border"
              >
                取消
              </button>
              <button
                onClick={handleSaveSample}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                确认覆盖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      {showGenerator && (
        <SampleGeneratorModal
            rule={currentRule}
            enums={enums}
            onClose={() => setShowGenerator(false)}
            onGenerate={handleGeneratedSample}
        />
      )}
    </div>
  );
};

export default ParserView;
