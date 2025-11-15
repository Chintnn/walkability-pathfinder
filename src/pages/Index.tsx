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
      // Step 1: Convert place name → coordinates
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

      toast.info("Analyzing walkability...", {
        description: "Processing OSM data",
      });

      // Step 2: POST request to backend
      const backendResponse = await fetch(getApiUrl("ANALYZE_POST"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lon }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend returned status ${backendResponse.status}`);
      }

      const backendData: BackendAnalysisResponse =
        await backendResponse.json();

      console.log("Backend Response:", backendData);

      // Convert backend structure → frontend structure
      const transformedClusters = transformBackendClusters(
        backendData.clusters
      );

      setAnalysisData({
        clusters: transformedClusters,
        avgWalkabilityScore: calculateAverageScore(transformedClusters),
      });

      toast.success("Analysis complete!", {
        description: `Found ${transformedClusters.length} clusters`,
      });

      // Step 3: Save selected map area
      const offset = 0.005;
      const boundingBox = [
        [lat - offset, lon - offset],
        [lat + offset, lon + offset],
      ];

      setSelectedArea({ lat, lon, boundingBox });
      setIsAnalyzing(false);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed", {
        description: "Try again or check your backend URL.",
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
        description: "Impact updated",
      });
    }, 1500);
  };

  const handleGenerateReport = () => {
    toast.success("Generating policy report...", {
      description: "Downloading PDF...",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSearch={handleSearch} isSearching={isAnalyzing} />

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-4">
          <MapView
            clusters={analysisData?.clusters}
            selectedArea={selectedArea}
          />
        </div>

        {/* Panel */}
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
