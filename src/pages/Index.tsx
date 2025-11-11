import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import AnalysisPanel from "@/components/AnalysisPanel";
import { generateMockAnalysisData } from "@/lib/mockData";
import { toast } from "sonner";


const Index = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  const handleSearch = async (query: string) => {
    setIsAnalyzing(true);
    toast.info("Searching location...", {
      description: query
    });

    try {
      // Use Nominatim geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        toast.error("Location not found", {
          description: "Please try a different search term"
        });
        setIsAnalyzing(false);
        return;
      }

      const location = data[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);


      // start of changes - fast api link

      // Call your FastAPI backend through ngrok
      try {
        const backendResponse = await fetch("https://https://unhelpable-acridly-rylee.ngrok-free.dev/analyze", {
        method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
      body: JSON.stringify({ lat, lon }),
      });
      const backendData = await backendResponse.json();
      console.log("Backend Data:", backendData);
      // Example: Update analysis panel
      setAnalysisData(backendData);
      } catch (error) {
        console.error("Error calling backend:", error);
      }

      // end of changes - fast api link

      
      // Create a bounding box (approximately 1km x 1km)
      const offset = 0.005; // roughly 0.5km in degrees
      const boundingBox = [
        [lat - offset, lon - offset],
        [lat + offset, lon + offset]
      ];

      setSelectedArea({ lat, lon, boundingBox });

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
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed", {
        description: "Please try again"
      });
      setIsAnalyzing(false);
    }
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
