import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  AlertCircle, 
  TrendingUp, 
  MapPin, 
  Zap,
  ArrowRight,
  Download
} from "lucide-react";

interface AnalysisPanelProps {
  data: {
    clusters: Array<{
      id: string;
      severity: "high" | "medium" | "low";
      metrics: {
        score: number;
        name: string;
      };
    }>;
    avgWalkabilityScore?: number;
  } | null;
  onSimulate: (recommendations: string[]) => void;
  onGenerateReport: () => void;
  isLoading?: boolean;
}

const AnalysisPanel = ({ 
  data, 
  onSimulate, 
  onGenerateReport,
  isLoading = false 
}: AnalysisPanelProps) => {
  if (!data) {
    return (
      <Card className="h-full p-6 brutalist-border bg-card flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          Select an area on the map to begin analysis
        </p>
      </Card>
    );
  }

  const highSeverityClusters = data.clusters.filter(c => c.severity === "high").length;
  const avgWalkability = data.avgWalkabilityScore || 50;

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4">
      {/* Overview Stats */}
      <Card className="p-6 brutalist-border brutalist-shadow bg-card">
        <h2 className="text-2xl font-bold mb-4 border-b-2 border-border pb-2">
          Analysis Overview
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-bold">WALKABILITY SCORE</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{avgWalkability}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <Progress value={avgWalkability} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-bold">CRITICAL AREAS</p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-destructive">{highSeverityClusters}</span>
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </div>
      </Card>

      {/* Bottleneck Clusters */}
      <Card className="p-6 brutalist-border brutalist-shadow bg-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Identified Bottlenecks
        </h3>
        
        <div className="space-y-3">
          {data.clusters.slice(0, 5).map((cluster) => (
            <div 
              key={cluster.id}
              className="p-4 border-2 border-border bg-muted space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{cluster.metrics.name}</span>
                <Badge 
                  variant={cluster.severity === "high" ? "destructive" : cluster.severity === "medium" ? "default" : "secondary"}
                  className="font-bold"
                >
                  {cluster.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Walkability Score:</span>
                <span className="font-bold">{cluster.metrics.score}/100</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 brutalist-border brutalist-shadow bg-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Analysis Actions
        </h3>
        
        <div className="space-y-3">
          <Button 
            onClick={() => onSimulate(data.clusters.map(c => c.id))}
            className="w-full brutalist-shadow font-bold"
            disabled={isLoading}
          >
            Run Scenario Simulation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button 
            onClick={onGenerateReport}
            variant="outline"
            className="w-full brutalist-shadow font-bold"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Policy Report
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisPanel;
