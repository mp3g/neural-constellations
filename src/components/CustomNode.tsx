import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const CustomNode = ({ data }: NodeProps) => {
  const nodeColor = data.color || 'hsl(var(--graph-node))';
  
  return (
    <div
      className="px-6 py-4 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-pointer"
      style={{
        backgroundColor: nodeColor,
        borderColor: nodeColor,
        boxShadow: `0 4px 20px ${nodeColor}40`,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-accent" />
      <div className="text-lg font-bold text-primary-foreground">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-accent" />
    </div>
  );
};

export default memo(CustomNode);
