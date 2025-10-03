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
import { X } from 'lucide-react';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 150, y: 50 },
    data: { label: 'MAR' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 350, y: 250 },
    data: { label: 'AER' },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 550, y: 250 },
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
    setSelectedNode((selected) =>
      selected?.id === nodeId
        ? { ...selected, data: { ...selected.data, label: newLabel } }
        : selected
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
    setSelectedNode((selected) =>
      selected?.id === nodeId
        ? { ...selected, data: { ...selected.data, color: newColor } }
        : selected
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

  const importFromJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const graphData = JSON.parse(event.target?.result as string);
          
          const importedNodes: Node[] = graphData.nodes.map((node: any) => ({
            id: node.id,
            type: 'custom',
            position: node.position,
            data: { label: node.label, color: node.color },
          }));

          const importedEdges: Edge[] = graphData.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: edge.animated ?? true,
          }));

          setNodes(importedNodes);
          setEdges(importedEdges);
          toast.success('Graph imported successfully');
        } catch (error) {
          toast.error('Failed to import graph. Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Edit Node</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
      
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={importFromJSON}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
        >
          Import JSON
        </button>
        <button
          onClick={exportToJSON}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
};
