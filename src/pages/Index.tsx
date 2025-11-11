import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import AnalysisPanel from "@/components/AnalysisPanel";
import { toast } from "sonner";
import { getApiUrl } from "@/config/api";
import { BackendAnalysisResponse } from "@/types/backend";
import { transformBackendClusters } from "@/utils/dataTransform";

const Index = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const calculateAverageScore = (clusters: any[]) => {
    if (!clusters || clusters.length === 0) return 0;
    const sum = clusters.reduce((acc, c) => acc + c.metrics.score, 0);
    return Math.round(sum / clusters.length);
  };

  const handleSearch = async (query: string) => {
    setIsAnalyzing(true);
    toast.info("Searching location...", { description: query });

    try {
      // Step 1: Get location coordinates using OpenStreetMap API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        toast.error("Location not found", {
          description: "Please try a different search term",
        });
        setIsAnalyzing(false);
        return;
      }

      const location = data[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);

      // Step 2: Call FastAPI backend for analysis
      toast.info("Analyzing walkability...", {
        description: "Processing OSM data with AI model",
      });

      try {
        const backendResponse = await fetch(getApiUrl("ANALYZE"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lon }),
        });

        if (!backendResponse.ok) {
          throw new Error(`Backend error: ${backendResponse.status}`);
        }

        const backendData: BackendAnalysisResponse = await backendResponse.json();
        console.log("Backend Response:", backendData);

        // Transform backend data to frontend format
        const transformedClusters = transformBackendClusters(backendData.clusters);
        
        setAnalysisData({
          clusters: transformedClusters,
          avgWalkabilityScore: calculateAverageScore(transformedClusters),
        });

        toast.success("Analysis complete!", {
          description: `Found ${transformedClusters.length} walkability clusters`,
        });
      } catch (error) {
        console.error("Backend error:", error);
        toast.error("Analysis failed", {
          description: "Please check your API configuration in src/config/api.ts",
        });
        setIsAnalyzing(false);
        return;
      }

      // Step 3: Create bounding box (for visualization)
      const offset = 0.005; // roughly 0.5km
      const boundingBox = [
        [lat - offset, lon - offset],
        [lat + offset, lon + offset],
      ];

      setSelectedArea({ lat, lon, boundingBox });
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed", {
        description: "Please try again.",
      });
      setIsAnalyzing(false);
    }
  };

  const handleSimulate = (recommendations: string[]) => {
    toast.success("Simulation running...", {
      description: `Applying ${recommendations.length} interventions`,
    });

    setTimeout(() => {
      toast.success("Simulation complete!", {
        description: "Impact estimates updated",
      });
    }, 1500);
  };

  const handleGenerateReport = () => {
    toast.success("Generating policy report...", {
      description: "Your PDF will download shortly",
    });

    setTimeout(() => {
      toast.success("Report ready!", {
        description: "Download starting now",
        action: {
          label: "Download",
          onClick: () => console.log("Download report"),
        },
      });
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSearch={handleSearch} isSearching={isAnalyzing} />

      <div className="flex-1 flex overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 p-4">
          <MapView
            clusters={analysisData?.clusters}
            selectedArea={selectedArea}
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
