import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  AlertCircle,
  MapPin,
  Zap,
  ArrowRight,
  Download,
} from "lucide-react";

interface ClusterType {
  id: string;
  severity: "high" | "medium" | "low";
  metrics: { score: number; name: string };
  coordinates: [number, number];
  description?: string;
}

interface AnalysisPanelProps {
  data: {
    clusters: ClusterType[];
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
  isLoading = false,
}: AnalysisPanelProps) => {
  if (!data) {
    return (
      <Card className="h-full p-6 flex items-center justify-center bg-card">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground ml-4">
          Select an area to begin analysis
        </p>
      </Card>
    );
  }

  const highSeverityCount = data.clusters.filter(
    (c) => c.severity === "high"
  ).length;

  const avgScore = data.avgWalkabilityScore || 50;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Overview */}
      <Card className="p-6 bg-card">
        <h2 className="text-2xl font-bold mb-4">Analysis Overview</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-sm text-muted-foreground">
              Walkability Score
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{avgScore}</span>
              <span>/100</span>
            </div>
            <Progress value={avgScore} className="h-2" />
          </div>

          <div>
            <p className="font-bold text-sm text-muted-foreground">
              Critical Bottlenecks
            </p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-destructive">
                {highSeverityCount}
              </span>
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </div>
      </Card>

      {/* Cluster List */}
      <Card className="p-6 bg-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Bottleneck Areas
        </h3>

        <div className="space-y-3">
          {data.clusters.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="p-4 border rounded bg-muted"
            >
              <div className="flex justify-between">
                <span className="font-bold">{c.metrics.name}</span>
                <Badge
                  variant={
                    c.severity === "high"
                      ? "destructive"
                      : c.severity === "medium"
                      ? "default"
                      : "secondary"
                  }
                >
                  {c.severity.toUpperCase()}
                </Badge>
              </div>

              <p className="text-sm">
                Score: <b>{c.metrics.score}/100</b>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6 bg-card">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actions
        </h3>

        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => onSimulate(data.clusters.map((c) => c.id))}
          >
            Run Simulation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            className="w-full"
            variant="outline"
            disabled={isLoading}
            onClick={onGenerateReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisPanel;
