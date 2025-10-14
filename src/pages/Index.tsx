import { useRef } from "react";
import { GraphCanvas, GraphCanvasRef } from "@/components/GraphCanvas";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, Image } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => graphRef.current?.exportToJSON()}>
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => graphRef.current?.exportToPNG()}>
                <Image className="w-4 h-4 mr-2" />
                Export as PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <GraphCanvas ref={graphRef} />
      </main>
    </div>
  );
};

export default Index;
