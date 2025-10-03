import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { label: 'MAR' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 250 },
    data: { label: 'AER' },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 250 },
    data: { label: 'TERRA' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-1', source: '3', target: '1', animated: true },
];

export const GraphCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
    toast.success('Node label updated');
  }, [setNodes]);

  const updateNodeColor = useCallback((nodeId: string, newColor: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    );
    toast.success('Node color updated');
  }, [setNodes]);

  const exportToJSON = useCallback(() => {
    const graphData = {
      nodes: nodes.map(node => ({
        id: node.id,
        label: node.data.label,
        position: node.position,
        color: node.data.color,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
      })),
    };

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'graph-data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Graph exported to JSON');
  }, [nodes, edges]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[hsl(var(--graph-background))]"
      >
        <Background color="hsl(var(--graph-edge))" gap={16} />
        <Controls className="bg-card border-border" />
      </ReactFlow>
      
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-card p-4 rounded-lg border border-border shadow-lg space-y-3 w-64">
          <h3 className="text-sm font-semibold text-foreground">Edit Node</h3>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              type="text"
              value={selectedNode.data.label}
              onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Color</label>
            <input
              type="color"
              value={selectedNode.data.color || '#a855f7'}
              onChange={(e) => updateNodeColor(selectedNode.id, e.target.value)}
              className="w-full h-10 rounded-md cursor-pointer"
            />
          </div>
        </div>
      )}
      
      <button
        onClick={exportToJSON}
        className="absolute bottom-4 right-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
      >
        Export to JSON
      </button>
    </div>
  );
};
