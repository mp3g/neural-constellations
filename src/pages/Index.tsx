import { GraphCanvas } from "@/components/GraphCanvas";

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Graph Visualizer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive graph with exportable nodes and edges
        </p>
      </header>
      <main className="flex-1 overflow-hidden">
        <GraphCanvas />
      </main>
    </div>
  );
};

export default Index;
