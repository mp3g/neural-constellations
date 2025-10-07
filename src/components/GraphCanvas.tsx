import { useCallback, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
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
  EdgeTypes,
  ControlButton,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import FloatingEdge from './FloatingEdge';
import { toast } from 'sonner';
import { X, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
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
  { id: 'e1-2', source: '1', target: '2', animated: true, type: 'floating' },
  { id: 'e2-3', source: '2', target: '3', animated: true, type: 'floating' },
  { id: 'e3-1', source: '3', target: '1', animated: true, type: 'floating' },
];

export interface GraphCanvasRef {
  exportToJSON: () => void;
  importFromJSON: () => void;
}

export const GraphCanvas = forwardRef<GraphCanvasRef>((props, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

  const toggleExpand = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, isExpanded: !node.data.isExpanded } }
          : node
      )
    );
  }, [setNodes]);

  const toggleExpandAll = useCallback(() => {
    const newExpandedState = !allExpanded;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.data.children && node.data.children.length > 0) {
          return { ...node, data: { ...node.data, isExpanded: newExpandedState } };
        }
        return node;
      })
    );
    setAllExpanded(newExpandedState);
    toast.success(newExpandedState ? 'All nodes expanded' : 'All nodes collapsed');
  }, [allExpanded, setNodes]);

  const visibleNodes = useMemo(() => {
    const shouldShowNode = (node: Node): boolean => {
      if (!node.data.parentId) return true;
      
      const parent = nodes.find(n => n.id === node.data.parentId);
      if (!parent) return true;
      
      if (!parent.data.isExpanded) return false;
      
      return shouldShowNode(parent);
    };

    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onToggleExpand: toggleExpand,
      },
    })).filter(shouldShowNode);
  }, [nodes, toggleExpand]);

  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, visibleNodes]);

  const addNewNode = useCallback(() => {
    const newId = `${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: `Node ${newId.slice(-4)}`,
        isExpanded: true,
        children: [],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success('New node added');
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'floating' }, eds)),
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
  }, [setNodes]);

  const updateNodeParent = useCallback((nodeId: string, parentId: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          const oldParentId = node.data.parentId;
          
          if (oldParentId) {
            const oldParent = nds.find(n => n.id === oldParentId);
            if (oldParent) {
              oldParent.data.children = (oldParent.data.children || []).filter((id: string) => id !== nodeId);
            }
          }
          
          return { ...node, data: { ...node.data, parentId: parentId || undefined } };
        }
        
        if (node.id === parentId) {
          const children = node.data.children || [];
          if (!children.includes(nodeId)) {
            return { 
              ...node, 
              data: { 
                ...node.data, 
                children: [...children, nodeId],
                isExpanded: node.data.isExpanded ?? true
              } 
            };
          }
        }
        
        return node;
      });
      
      return updatedNodes;
    });
    
    setSelectedNode((selected) => {
      if (selected?.id === nodeId) {
        return { ...selected, data: { ...selected.data, parentId: parentId || undefined } };
      }
      return selected;
    });
    
    toast.success('Parent node updated');
  }, [setNodes]);

  const exportToJSON = useCallback(() => {
    const graphData = {
      nodes: nodes.map(node => ({
        id: node.id,
        label: node.data.label,
        position: node.position,
        color: node.data.color,
        parentId: node.data.parentId,
        children: node.data.children || [],
        isExpanded: node.data.isExpanded ?? true,
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
            data: { 
              label: node.label, 
              color: node.color,
              parentId: node.parentId,
              children: node.children || [],
              isExpanded: node.isExpanded ?? true,
            },
          }));

          const importedEdges: Edge[] = graphData.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: edge.animated ?? true,
            type: 'floating',
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

  useImperativeHandle(ref, () => ({
    exportToJSON,
    importFromJSON,
  }));

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        elementsSelectable
        deleteKeyCode="Delete"
        fitView
        className="bg-[hsl(var(--graph-background))]"
      >
        <Background color="hsl(var(--graph-edge))" gap={16} />
        <Controls className="bg-card border-border">
          <ControlButton onClick={toggleExpandAll} title={allExpanded ? "Collapse All" : "Expand All"}>
            {allExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ControlButton>
        </Controls>
      </ReactFlow>

      <div className="absolute top-4 left-4">
        <Button
          onClick={addNewNode}
          size="sm"
          className="shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Node
        </Button>
      </div>
      
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
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Parent Node</label>
            <select
              value={selectedNode.data.parentId || ''}
              onChange={(e) => updateNodeParent(selectedNode.id, e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="">None</option>
              {nodes
                .filter(n => n.id !== selectedNode.id)
                .sort((a, b) => a.data.label.localeCompare(b.data.label))
                .map(node => (
                  <option key={node.id} value={node.id}>
                    {node.data.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
});
