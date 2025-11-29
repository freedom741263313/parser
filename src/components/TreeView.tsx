import React from 'react';
import { ParsedField } from '../types/rule';
import { ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface TreeViewProps {
  data: ParsedField[];
}

const TreeItem = ({ item, depth = 0 }: { item: ParsedField; depth?: number }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="text-sm font-mono">
      <div 
        className={clsx(
          "flex items-center py-1 hover:bg-accent/50 cursor-pointer select-none",
          item.error && "text-destructive"
        )}
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="w-4 h-4 flex items-center justify-center mr-1">
          {hasChildren && (
            isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          )}
        </div>
        <span className="font-bold mr-2 text-primary">{item.name}:</span>
        <span className="text-muted-foreground mr-2">[{item.offset}:{item.length}]</span>
        <span className="text-foreground">{item.displayValue}</span>
        {item.error && <span className="ml-2 text-destructive font-bold">({item.error})</span>}
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {item.children!.map((child, idx) => (
            <TreeItem key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView = ({ data }: TreeViewProps) => {
  return (
    <div className="border rounded-md p-2 bg-card overflow-auto h-full">
      {data.map((item, idx) => (
        <TreeItem key={idx} item={item} />
      ))}
    </div>
  );
};
