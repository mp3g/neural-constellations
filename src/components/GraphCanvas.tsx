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
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import FloatingEdge from './FloatingEdge';
import { toast } from 'sonner';
import { X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
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
    data: { label: 'MAR', isExpanded: true, children: [] },
    style: { width: 150, height: 80 },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 350, y: 250 },
    data: { label: 'AER', isExpanded: true, children: [] },
    style: { width: 150, height: 80 },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 550, y: 250 },
    data: { label: 'TERRA', isExpanded: true, children: [] },
    style: { width: 150, height: 80 },
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
  exportToPNG: () => void;
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
        selected: selectedNode?.id === node.id,
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
      style: { width: 150, height: 80 },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success('New node added');
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent self-reference
      if (params.source === params.target) {
        toast.error('Cannot connect a node to itself');
        return;
      }

      // Check for circular dependency: verify that source is not a descendant of target
      if (params.source && params.target) {
        const isDescendant = (nodeId: string, ancestorId: string): boolean => {
          const node = nodes.find(n => n.id === nodeId);
          if (!node || !node.data.parentId) return false;
          if (node.data.parentId === ancestorId) return true;
          return isDescendant(node.data.parentId, ancestorId);
        };

        if (isDescendant(params.source, params.target)) {
          toast.error('Cannot create circular parent-child relationship');
          return;
        }
      }

      setEdges((eds) => addEdge({ ...params, animated: true, type: 'floating' }, eds));
      
      // Set parent-child relationship: source becomes parent of target
      if (params.source && params.target) {
        setNodes((nds) => {
          return nds.map((node) => {
            // Update target node to have source as parent
            if (node.id === params.target) {
              const oldParentId = node.data.parentId;
              
              // Remove from old parent's children if it had one
              if (oldParentId) {
                const oldParent = nds.find(n => n.id === oldParentId);
                if (oldParent) {
                  oldParent.data.children = (oldParent.data.children || []).filter((id: string) => id !== params.target);
                }
              }
              
              return { ...node, data: { ...node.data, parentId: params.source } };
            }
            
            // Update source node to include target in children
            if (node.id === params.source) {
              const children = node.data.children || [];
              if (!children.includes(params.target)) {
                return { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    children: [...children, params.target],
                    isExpanded: node.data.isExpanded ?? true
                  } 
                };
              }
            }
            
            return node;
          });
        });
        
        toast.success('Nodes connected - parent relationship established');
      }
    },
    [setEdges, setNodes, nodes]
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
    // Prevent self-reference
    if (nodeId === parentId) {
      toast.error('Cannot set a node as its own parent');
      return;
    }

    // Check for circular dependency: verify that parent is not a descendant of node
    if (parentId) {
      const isDescendant = (checkNodeId: string, ancestorId: string): boolean => {
        const node = nodes.find(n => n.id === checkNodeId);
        if (!node || !node.data.parentId) return false;
        if (node.data.parentId === ancestorId) return true;
        return isDescendant(node.data.parentId, ancestorId);
      };

      if (isDescendant(parentId, nodeId)) {
        toast.error('Cannot create circular parent-child relationship');
        return;
      }
    }

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
  }, [setNodes, nodes]);

  const updateNodeSize = useCallback((nodeId: string, width: number, height: number) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, style: { ...node.style, width, height } }
          : node
      )
    );
    setSelectedNode((selected) =>
      selected?.id === nodeId
        ? { ...selected, style: { ...selected.style, width, height } }
        : selected
    );
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
        width: node.style?.width || node.width || 150,
        height: node.style?.height || node.height || 80,
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
            style: { 
              width: node.width || 150, 
              height: node.height || 80 
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

  const exportToPNG = useCallback(() => {
    const nodesBounds = getRectOfNodes(nodes);
    const padding = 100;
    
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;
    
    const transform = getTransformForBounds(
      nodesBounds, 
      imageWidth, 
      imageHeight, 
      0.5, 
      2,
      padding
    );

    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    
    if (!viewportElement) {
      toast.error('Failed to export graph');
      return;
    }

    toPng(viewportElement, {
      backgroundColor: '#1a1a2e',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'graph-export.png';
      link.href = dataUrl;
      link.click();
      toast.success('Graph exported as PNG');
    }).catch(() => {
      toast.error('Failed to export graph as PNG');
    });
  }, [nodes]);

  useImperativeHandle(ref, () => ({
    exportToJSON,
    importFromJSON,
    exportToPNG,
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
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        fitView
        minZoom={0.1}
        maxZoom={4}
        className="bg-[hsl(var(--graph-background))]"
      >
        <Background color="hsl(var(--graph-edge))" gap={16} />
        <Controls className="bg-card border-border">
          <ControlButton onClick={toggleExpandAll} title={allExpanded ? "Collapse All" : "Expand All"}>
            {allExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Width</label>
              <input
                type="number"
                value={Number(selectedNode.style?.width) || 150}
                onChange={(e) => updateNodeSize(selectedNode.id, Number(e.target.value), Number(selectedNode.style?.height) || 80)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                min="100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Height</label>
              <input
                type="number"
                value={Number(selectedNode.style?.height) || 80}
                onChange={(e) => updateNodeSize(selectedNode.id, Number(selectedNode.style?.width) || 150, Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                min="50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
