import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Send, Trash2, AlertCircle, Settings, FileCode, Zap } from 'lucide-react';
import { useUdp } from '../hooks/useUdp';
import { useStore } from '../hooks/useStore';
import { TemplateManager } from './TemplateManager';
import { AutoReplyManager } from './AutoReplyManager';
import { ParserEngine } from '../utils/parser';
import { PacketGenerator } from '../utils/generator';
import { hexToBuffer, cleanHex } from '../utils/hex';
import { UdpMessage } from '../types/udp';

const generator = new PacketGenerator();

const UdpDebugger = () => {
  const { rules, enums, templates, replyRules } = useStore();
  const { messages, isListening, error, start, stop, send, clearMessages } = useUdp();
  
  const [activeTab, setActiveTab] = useState<'debug' | 'templates' | 'reply'>('debug');
  const [localPort, setLocalPort] = useState('3000');
  const [remoteIp, setRemoteIp] = useState('127.0.0.1');
  const [remotePort, setRemotePort] = useState('3001');
  const [sendData, setSendData] = useState('');
  const [isAutoReply, setIsAutoReply] = useState(false);
  const [selectedSendTemplateId, setSelectedSendTemplateId] = useState('');

  const lastProcessedMsgRef = useRef<string | null>(null);

  // Auto Reply Logic
  useEffect(() => {
    if (!isAutoReply || !isListening || messages.length === 0) return;
    
    const lastMsg = messages[0];
    // Only process incoming messages that are new
    if (lastMsg.direction !== 'in' || lastMsg.id === lastProcessedMsgRef.current) return;
    
    lastProcessedMsgRef.current = lastMsg.id;
    processAutoReply(lastMsg);
  }, [messages, isAutoReply, isListening]);

  const processAutoReply = (msg: UdpMessage) => {
    try {
        const buffer = hexToBuffer(msg.data);
        const engine = new ParserEngine(enums);

        for (const rule of replyRules) {
            if (!rule.isActive) continue;

            const protocol = rules.find(p => p.id === rule.matchProtocolId);
            if (!protocol) continue;

            try {
                // Try to parse with this protocol
                // Note: This is inefficient for many rules/protocols, but works for demo
                // Ideally we should have a way to identify protocol first
                const parsed = engine.parse(buffer, protocol);
                
                // Check match condition
                // We need to flatten or search the parsed fields
                const findField = (fields: any[], id: string): any => {
                    for (const f of fields) {
                        if (f.name === id || f.description === id) return f; // ID might not be preserved in ParsedField easily if not using ID mapping
                        // The parser returns ParsedField which uses 'name' as key mostly?
                        // Wait, ParsedField has structure. Let's verify Parser output.
                        // The current Parser implementation returns ParsedField[]
                        // But we need to match by FieldDefinition ID. 
                        // Our current Parser doesn't attach the original Field ID to the result, just name.
                        // This is a limitation. For now, let's try to match by Name if ID fails, 
                        // OR we assume the user selects the Field Definition, and we find the corresponding parsed field by index or name.
                    }
                    return null;
                };
                
                // Actually, the rule.matchFieldId corresponds to a FieldDefinition.id
                // We need to find the FieldDefinition first to get its name
                const fieldDef = protocol.fields.find(f => f.id === rule.matchFieldId);
                if (!fieldDef) continue;

                const parsedField = parsed.find(p => p.name === fieldDef.name);
                if (!parsedField) continue;

                // Compare values
                // parsedField.value vs rule.matchValue
                // Convert both to string for comparison
                const valA = String(parsedField.value);
                const valB = String(rule.matchValue);

                if (valA === valB) {
                    // Match found! Send response
                    const responseTemplate = templates.find(t => t.id === rule.responseTemplateId);
                    if (responseTemplate) {
                        const responseProtocol = rules.find(r => r.id === responseTemplate.protocolId);
                        if (responseProtocol) {
                            const hex = generator.generate(responseProtocol, responseTemplate.values);
                            send(msg.remoteAddress, msg.remotePort, hex); // Reply to sender
                            console.log(`[AutoReply] Triggered rule "${rule.name}", sent template "${responseTemplate.name}"`);
                            return; // Stop after first match? Or continue? Usually first match wins.
                        }
                    }
                }
            } catch (e) {
                // Parse failed for this protocol, ignore
            }
        }
    } catch (e) {
        console.error("Auto reply processing error", e);
    }
  };

  const handleStart = () => {
    const port = parseInt(localPort, 10);
    if (!isNaN(port)) {
      start(port);
    }
  };

  const handleSend = () => {
    const port = parseInt(remotePort, 10);
    if (!isNaN(port) && remoteIp && sendData) {
      send(remoteIp, port, sendData);
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tid = e.target.value;
      setSelectedSendTemplateId(tid);
      if (tid) {
          const tmpl = templates.find(t => t.id === tid);
          if (tmpl) {
              const rule = rules.find(r => r.id === tmpl.protocolId);
              if (rule) {
                  const hex = generator.generate(rule, tmpl.values);
                  setSendData(hex);
              }
          }
      }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b bg-muted/40">
        <button
          onClick={() => setActiveTab('debug')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'debug' ? 'bg-background border-t border-x text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
        >
          <Settings className="h-4 w-4" /> 调试器
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'templates' ? 'bg-background border-t border-x text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
        >
          <FileCode className="h-4 w-4" /> 模版管理
        </button>
        <button
          onClick={() => setActiveTab('reply')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'reply' ? 'bg-background border-t border-x text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
        >
          <Zap className="h-4 w-4" /> 自动回复
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'templates' && <TemplateManager />}
        {activeTab === 'reply' && <AutoReplyManager />}
        
        {activeTab === 'debug' && (
            <div className="flex flex-col h-full gap-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    {/* Local */}
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm text-muted-foreground">本地监听</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">自动回复</span>
                                <button 
                                    onClick={() => setIsAutoReply(!isAutoReply)}
                                    className={`w-8 h-4 rounded-full transition-colors ${isAutoReply ? 'bg-green-500' : 'bg-gray-300'} relative`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isAutoReply ? 'left-4.5' : 'left-0.5'}`} style={{ left: isAutoReply ? '18px' : '2px' }} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={localPort}
                                onChange={(e) => setLocalPort(e.target.value)}
                                placeholder="端口"
                                className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
                                disabled={isListening}
                            />
                            {!isListening ? (
                                <button onClick={handleStart} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2 text-sm font-medium">
                                    <Play className="h-4 w-4" /> 启动
                                </button>
                            ) : (
                                <button onClick={stop} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center gap-2 text-sm font-medium">
                                    <Square className="h-4 w-4" /> 停止
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Remote */}
                    <div className="bg-card border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="font-semibold text-sm text-muted-foreground">发送消息</h3>
                             <select 
                                className="text-xs border rounded p-1 max-w-[120px]"
                                value={selectedSendTemplateId}
                                onChange={handleTemplateSelect}
                             >
                                <option value="">加载模版...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                             </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={remoteIp}
                                onChange={(e) => setRemoteIp(e.target.value)}
                                placeholder="IP地址"
                                className="px-3 py-2 bg-background border rounded-md text-sm"
                            />
                            <input
                                type="number"
                                value={remotePort}
                                onChange={(e) => setRemotePort(e.target.value)}
                                placeholder="端口"
                                className="px-3 py-2 bg-background border rounded-md text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={sendData}
                                onChange={(e) => setSendData(e.target.value)}
                                placeholder="Hex 数据"
                                className="flex-1 px-3 py-2 bg-background border rounded-md text-sm font-mono"
                            />
                            <button onClick={handleSend} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center gap-2 text-sm font-medium">
                                <Send className="h-4 w-4" /> 发送
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs */}
                <div className="flex-1 bg-card border rounded-lg flex flex-col min-h-0">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold">消息日志</h3>
                        <button onClick={clearMessages} className="text-muted-foreground hover:text-destructive" title="清空">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">时间</th>
                                    <th className="px-4 py-2">方向</th>
                                    <th className="px-4 py-2">地址</th>
                                    <th className="px-4 py-2">数据 (Hex)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString()}</td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${msg.direction === 'in' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {msg.direction === 'in' ? '接收' : '发送'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs">{msg.remoteAddress}:{msg.remotePort}</td>
                                        <td className="px-4 py-2 font-mono break-all">{msg.data}</td>
                                    </tr>
                                ))}
                                {messages.length === 0 && (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">暂无消息</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UdpDebugger;
