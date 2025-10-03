import { useRef } from "react";
import { GraphCanvas, GraphCanvasRef } from "@/components/GraphCanvas";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

const Index = () => {
  const graphRef = useRef<GraphCanvasRef>(null);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Graph Visualizer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive graph with exportable nodes and edges
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => graphRef.current?.importFromJSON()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => graphRef.current?.exportToJSON()}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <GraphCanvas ref={graphRef} />
      </main>
    </div>
  );
};

export default Index;
