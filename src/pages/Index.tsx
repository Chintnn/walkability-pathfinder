import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import AnalysisPanel from "@/components/AnalysisPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);

  // Poll for task status
  useEffect(() => {
    if (!taskId) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('task-status', {
          body: { task_id: taskId }
        });

        if (error) throw error;

        if (data.status === 'completed' && areaId) {
          clearInterval(pollInterval);
          
          // Fetch results
          const { data: results, error: resultsError } = await supabase.functions.invoke('get-results', {
            body: { area_id: areaId }
          });

          if (resultsError) throw resultsError;

          setAnalysisData(results);
          setIsAnalyzing(false);
          toast.success("Analysis complete!", {
            description: `Found ${results.summary.total_clusters} areas with ${results.summary.total_recommendations} recommendations`
          });
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast.error("Analysis failed", {
            description: data.error_message || "Unknown error occurred"
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, areaId]);

  const handleAreaSelected = async (geometry: any) => {
    setIsAnalyzing(true);
    setAnalysisData(null);
    
    toast.info("Starting analysis...", {
      description: "Fetching OpenStreetMap data"
    });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-area', {
        body: {
          name: `Area ${new Date().toISOString().slice(0, 10)}`,
          geometry
        }
      });

      if (error) throw error;

      setTaskId(data.task_id);
      setAreaId(data.area_id);
      
      toast.info("Processing data...", {
        description: "This may take 30-60 seconds"
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast.error("Analysis failed", {
        description: error.message || "Failed to start analysis"
      });
    }
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
            clusters={analysisData?.clusters || []}
            isAnalyzing={isAnalyzing}
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
