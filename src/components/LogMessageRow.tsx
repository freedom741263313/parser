import React, { useState, useMemo } from 'react';
import { Copy, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { UdpMessage } from '../types/udp';
import { ProtocolRule, ParsedField } from '../types/rule';
import { ParserEngine } from '../utils/parser';
import { formatHexBlock, hexToBuffer } from '../utils/hex';

interface LogMessageRowProps {
  msg: UdpMessage;
  rules: ProtocolRule[];
  engine: ParserEngine;
}

export const LogMessageRow: React.FC<LogMessageRowProps> = ({ msg, rules, engine }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(msg.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedResult = useMemo(() => {
    if (!msg.data) return null;
    
    try {
      const buffer = hexToBuffer(msg.data);
      
      // Try to find a matching protocol
      // We iterate through all custom rules to see if any parses successfully
      for (const rule of rules) {
        if (rule.type === 'custom') {
          try {
            const fields = engine.parse(buffer, rule);
            
            // Check if parsing was successful (no errors)
            // Also maybe check if it consumed a reasonable amount of data or matched specific criteria?
            // For now, if all fields are parsed without error, we assume it's a match.
            const hasError = fields.some(f => f.error);
            
            // Also check if the total length of parsed fields matches the buffer length?
            // Our parser doesn't strictly enforce total length check in the result array itself,
            // but we can sum up the length.
            const totalParsedLength = fields.reduce((acc, f) => acc + (f.length || 0), 0);
            
            if (!hasError && totalParsedLength > 0) {
               // If strict match is needed:
               // if (totalParsedLength === buffer.length)
               // But often protocols have padding or variable length, let's be lenient for now or check strictness.
               // Let's assume if it parses without error, it's a candidate.
               return { ruleName: rule.name, fields };
            }
          } catch (e) {
            // Continue to next rule
          }
        }
      }
    } catch (e) {
      console.error("Error preparing parse", e);
    }
    return null;
  }, [msg.data, rules, engine]);

  return (
    <>
      <tr 
        className={`hover:bg-muted/50 cursor-pointer select-text group ${isExpanded ? 'bg-muted/30' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${msg.direction === 'in' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
            {msg.direction === 'in' ? '接收' : '发送'}
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
          {msg.remoteAddress}:{msg.remotePort}
        </td>
        <td className="px-4 py-2 font-mono text-xs relative pr-10">
          <div className="truncate max-w-[300px]">
             {msg.data}
          </div>
          <button 
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            title="复制码流"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </td>
        <td className="px-2 py-2 w-8">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="bg-muted/20">
          <td colSpan={5} className="p-4">
            <div className="space-y-4">
                {/* Hex View */}
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">原始码流 (16字节/行)</h4>
                    <div className="bg-muted/50 p-3 rounded-md font-mono text-xs overflow-x-auto select-text whitespace-pre">
                        {formatHexBlock(msg.data)}
                    </div>
                </div>

                {/* Parsed View */}
                {parsedResult && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <h4 className="text-xs font-semibold text-muted-foreground">解析结果</h4>
                             <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                {parsedResult.ruleName}
                             </span>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">字段名</th>
                                        <th className="px-3 py-2 font-medium">值</th>
                                        <th className="px-3 py-2 font-medium">含义/格式化</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-background">
                                    {parsedResult.fields.map((field, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30">
                                            <td className="px-3 py-1.5 font-medium text-muted-foreground">{field.name}</td>
                                            <td className="px-3 py-1.5 font-mono select-text">{String(field.value)}</td>
                                            <td className="px-3 py-1.5 select-text text-muted-foreground">
                                                {field.displayValue !== String(field.value) ? field.displayValue : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {!parsedResult && (
                    <div className="text-xs text-muted-foreground italic">
                        未能匹配到已知协议规则进行解析
                    </div>
                )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
