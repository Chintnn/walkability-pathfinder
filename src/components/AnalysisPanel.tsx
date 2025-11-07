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
        sidewalk_pct: number;
        intersection_density: number;
        amenity_distance: number;
      };
    }>;
    recommendations: Array<{
      id: string;
      title: string;
      impact: string;
      cost: string;
      description: string;
    }>;
    impact: {
      co2_reduction: number;
      accessibility_increase: number;
      walkability_improvement: number;
    };
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
  const avgWalkability = Math.round(
    data.clusters.reduce((acc, c) => acc + c.metrics.score, 0) / data.clusters.length
  );

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
          {data.clusters.slice(0, 3).map((cluster) => (
            <div 
              key={cluster.id}
              className="p-4 border-2 border-border bg-muted space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Cluster {cluster.id}</span>
                <Badge 
                  variant={cluster.severity === "high" ? "destructive" : "secondary"}
                  className="font-bold"
                >
                  {cluster.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Sidewalk: </span>
                  <span className="font-bold">{cluster.metrics.sidewalk_pct}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Score: </span>
                  <span className="font-bold">{cluster.metrics.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 brutalist-border brutalist-shadow bg-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Recommended Interventions
        </h3>
        
        <div className="space-y-3">
          {data.recommendations.map((rec) => (
            <div 
              key={rec.id}
              className="p-4 border-2 border-border bg-background hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold">{rec.title}</h4>
                <Badge variant="outline" className="font-bold">
                  {rec.cost}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">{rec.impact}</span>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={() => onSimulate(data.recommendations.map(r => r.id))}
          className="w-full mt-4 brutalist-shadow font-bold"
          disabled={isLoading}
        >
          Run Scenario Simulation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>

      {/* Impact Estimates */}
      {data.impact && (
        <Card className="p-6 brutalist-border brutalist-shadow bg-primary text-primary-foreground">
          <h3 className="text-xl font-bold mb-4">Estimated Impact</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold">CO₂ Reduction</span>
              <span className="text-2xl font-bold">{data.impact.co2_reduction}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Accessibility Increase</span>
              <span className="text-2xl font-bold">{data.impact.accessibility_increase}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Walkability Improvement</span>
              <span className="text-2xl font-bold">{data.impact.walkability_improvement}%</span>
            </div>
          </div>

          <Button 
            onClick={onGenerateReport}
            variant="secondary"
            className="w-full mt-4 brutalist-shadow font-bold"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Policy Report
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AnalysisPanel;
