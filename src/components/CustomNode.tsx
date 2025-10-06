import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CustomNode = ({ data }: NodeProps) => {
  const nodeColor = data.color || 'hsl(var(--graph-node))';
  const hasChildren = data.children && data.children.length > 0;
  
  return (
    <div
      className="px-6 py-4 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer relative"
      style={{
        backgroundColor: nodeColor,
        borderColor: nodeColor,
        boxShadow: `0 4px 20px ${nodeColor}40`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-accent" />
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleExpand?.(data.id);
            }}
            className="text-primary-foreground hover:opacity-80 transition-opacity"
          >
            {data.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        <div className="text-lg font-bold text-primary-foreground">
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-accent" />
    </div>
  );
};

export default memo(CustomNode);
