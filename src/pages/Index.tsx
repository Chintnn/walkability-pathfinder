import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import AnalysisPanel from "@/components/AnalysisPanel";
import { generateMockAnalysisData } from "@/lib/mockData";
import { toast } from "sonner";

const Index = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAreaSelected = (geometry: any) => {
    setIsAnalyzing(true);
    toast.info("Analyzing area...", {
      description: "Fetching OpenStreetMap data and running AI analysis"
    });

    // Simulate API call with mock data
    setTimeout(() => {
      const mockData = generateMockAnalysisData();
      setAnalysisData(mockData);
      setIsAnalyzing(false);
      toast.success("Analysis complete!", {
        description: `Found ${mockData.clusters.length} bottleneck areas`
      });
    }, 2000);
  };

  const handleSearch = (query: string) => {
    toast.info("Searching location...", {
      description: query
    });
  };

  const handleSimulate = (recommendations: string[]) => {
    toast.success("Simulation running...", {
      description: `Applying ${recommendations.length} interventions`
    });
    
    setTimeout(() => {
      toast.success("Simulation complete!", {
        description: "Impact estimates updated"
      });
    }, 1500);
  };

  const handleGenerateReport = () => {
    toast.success("Generating policy report...", {
      description: "Your PDF will download shortly"
    });

    setTimeout(() => {
      toast.success("Report ready!", {
        description: "Download starting now",
        action: {
          label: "Download",
          onClick: () => console.log("Download report")
        }
      });
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSearch={handleSearch} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 p-4">
          <MapView 
            onAreaSelected={handleAreaSelected}
            clusters={analysisData?.clusters}
          />
        </div>

        {/* Analysis Panel */}
        <div className="w-[400px] border-l-4 border-border">
          <AnalysisPanel
            data={analysisData}
            onSimulate={handleSimulate}
            onGenerateReport={handleGenerateReport}
            isLoading={isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
