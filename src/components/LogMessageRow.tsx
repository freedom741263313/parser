import React, { useState, useMemo } from 'react';
import { Copy, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { UdpMessage } from '../types/udp';
import { ProtocolRule, ParsedField, PacketTemplate, MatchRange } from '../types/rule';
import { ParserEngine } from '../utils/parser';
import { PacketGenerator } from '../utils/generator';
import { formatHexBlock, hexToBuffer, cleanHex } from '../utils/hex';

interface LogMessageRowProps {
  msg: UdpMessage;
  rules: ProtocolRule[];
  templates: PacketTemplate[];
  engine: ParserEngine;
}

const generator = new PacketGenerator();

export const LogMessageRow: React.FC<LogMessageRowProps> = ({ msg, rules, templates, engine }) => {
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
    
    const msgHex = cleanHex(msg.data);

    // Iterate through all templates to find a match
    for (const template of templates) {
      const rule = rules.find(r => r.id === template.protocolId);
      if (!rule) continue;

      try {
        let isMatch = false;

        // 1. Check for configured Match Rules (Feature Matching)
        if (template.matchRanges && template.matchRanges.length > 0) {
            let allRangesMatch = true;
            // Generate full hex for the template (can be optimized to generate only needed parts later)
            const templateHex = cleanHex(generator.generate(rule, template.values));
            
            for (const range of template.matchRanges) {
                let targetOffset = range.offset || 0;
                let targetLength = range.length || 1;
                let targetValue = range.value;

                // If field-based match, derive offset/length/value from rule and template
                if (range.type === 'field' && range.fieldId) {
                    const field = rule.fields.find(f => f.id === range.fieldId);
                    if (field) {
                        // Calculate offset if not stored (needs to traverse previous fields)
                        // Ideally field definition has offset, but it might be auto-calculated
                        // Simple assumption: re-calculate offset by summing lengths of previous fields
                        // NOTE: This is a simplification. Complex rules might have dynamic offsets.
                        // For now, we rely on the fact that generator.generate produces the full hex in order.
                        
                        // We need to find where this field is in the generated hex
                        // This is tricky without running a full parse trace or generation trace.
                        // BUT, since we have the FULL templateHex and the FULL rule, 
                        // we can actually re-use the Parser to find the offset of the field!
                        // OR simpler: if we generated the hex, we assume the structure matches.
                        
                        // Let's try to find the field's position.
                        let currentOffset = 0;
                        for (const f of rule.fields) {
                            if (f.id === range.fieldId) {
                                targetOffset = currentOffset;
                                targetLength = f.length;
                                break;
                            }
                            currentOffset += f.length;
                        }
                        
                        // The value in the templateHex at this position is what we expect
                        // (We don't need to re-format the value from template.values, just extract from hex)
                        if (templateHex.length >= (targetOffset + targetLength) * 2) {
                             targetValue = templateHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);
                        }
                    }
                } else {
                    // Custom range: targetValue must be provided or extracted from templateHex
                    if (!targetValue && templateHex.length >= (targetOffset + targetLength) * 2) {
                        targetValue = templateHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);
                    }
                }

                // Perform the check
                if (!targetValue) {
                    allRangesMatch = false;
                    break;
                }

                // Extract corresponding part from message
                if (msgHex.length < (targetOffset + targetLength) * 2) {
                    allRangesMatch = false;
                    break;
                }
                
                const msgPart = msgHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);
                
                if (msgPart.toLowerCase() !== targetValue.toLowerCase()) {
                    allRangesMatch = false;
                    break;
                }
            }
            
            if (allRangesMatch) {
                isMatch = true;
            }

        } else {
            // 2. Fallback: Full Hex Match (Legacy behavior)
            // Generate hex from template values
            const templateHex = generator.generate(rule, template.values);
            
            // Compare generated hex with message hex
            if (cleanHex(templateHex).toLowerCase() === msgHex.toLowerCase()) {
                isMatch = true;
            }
        }

        if (isMatch) {
          // If match, parse the message to get field details
          const buffer = hexToBuffer(msg.data);
          const fields = engine.parse(buffer, rule);
          
          return { ruleName: template.name, fields };
        }

      } catch (e) {
         // Ignore errors during generation (e.g. incomplete template)
         // console.error('Generator error:', e);
         continue;
       }
    }
    
    return null;
  }, [msg.data, rules, templates, engine]);

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
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${msg.direction === 'in' ? 'bg-primary/15 text-primary' : 'bg-green-500/15 text-green-600 dark:text-green-400'}`}>
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
