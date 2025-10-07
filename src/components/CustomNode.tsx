import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CustomNode = ({ id, data }: NodeProps) => {
  const nodeColor = data.color || 'hsl(var(--graph-node))';
  const hasChildren = data.children && data.children.length > 0;
  
  return (
    <div
      className="px-6 py-4 rounded-lg border-2 transition-all duration-200 hover:scale-110 cursor-pointer relative backdrop-blur-sm"
      style={{
        backgroundColor: `${nodeColor}20`,
        borderColor: nodeColor,
        boxShadow: `0 0 20px ${nodeColor}, 0 0 40px ${nodeColor}80, inset 0 0 20px ${nodeColor}30`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleExpand?.(id);
            }}
            className="text-foreground hover:opacity-80 transition-opacity"
            style={{ color: nodeColor }}
          >
            {data.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        <div 
          className="text-lg font-bold drop-shadow-[0_0_8px_currentColor]"
          style={{ color: nodeColor }}
        >
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default memo(CustomNode);
