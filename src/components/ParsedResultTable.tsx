import React from 'react';
import { ParsedField } from '../types/rule';
import clsx from 'clsx';

interface ParsedResultTableProps {
  data: ParsedField[];
}

export const ParsedResultTable: React.FC<ParsedResultTableProps> = ({ data }) => {
  return (
    <div className="w-full border rounded-md overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground font-medium">
          <tr>
            <th className="p-2 border-b">名称</th>
            <th className="p-2 border-b">字节值</th>
            <th className="p-2 border-b">原始16进制</th>
            <th className="p-2 border-b">含义</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={`${item.name}-${index}`} 
              className={clsx(
                "hover:bg-accent/50 transition-colors",
                item.error && "bg-destructive/10"
              )}
            >
              <td className="p-2 border-b font-medium">
                {item.name}
                {item.children && <span className="ml-2 text-xs text-muted-foreground">(复合)</span>}
              </td>
              <td className="p-2 border-b font-mono">
                {item.arrayValues ? (
                  <div className="flex flex-col gap-0.5">
                    {item.arrayValues.map((val, idx) => (
                      <div key={idx}>{val}</div>
                    ))}
                  </div>
                ) : (
                  item.formattedValue || item.displayValue
                )}
              </td>
              <td className="p-2 border-b font-mono text-xs text-muted-foreground">
                {item.length <= 4 ? item.rawHex : '-'}
              </td>
              <td className="p-2 border-b">
                <span className={clsx(
                  item.meaning !== item.name ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {item.meaning || item.name}
                </span>
                {item.error && <div className="text-destructive text-xs mt-1">{item.error}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
