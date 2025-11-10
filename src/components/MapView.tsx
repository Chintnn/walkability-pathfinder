import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/button";
import { MapPin, Square, Circle } from "lucide-react";

interface MapViewProps {
  onAreaSelected: (geometry: any) => void;
  clusters?: Array<{
    id: string;
    geometry: any;
    severity: "high" | "medium" | "low";
    metrics: any;
  }>;
  isAnalyzing?: boolean;
}

const MapView = ({ onAreaSelected, clusters, isAnalyzing }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [drawMode, setDrawMode] = useState<"polygon" | "circle" | null>(null);
  const drawnLayersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainer.current, {
      center: [12.9716, 77.5946], // Bangalore
      zoom: 13,
      zoomControl: false,
    });

    mapRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add zoom control to top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Add drawn layers group
    drawnLayersRef.current.addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // Handle drawing
  useEffect(() => {
    if (!mapRef.current || !drawMode) return;

    const map = mapRef.current;
    let tempLayer: L.Circle | L.Polygon | null = null;
    let latlngs: L.LatLng[] = [];

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawMode === "polygon") {
        latlngs.push(e.latlng);
        
        if (tempLayer) {
          map.removeLayer(tempLayer);
        }

        if (latlngs.length > 0) {
          tempLayer = L.polygon(latlngs, {
            color: "hsl(152 24% 42%)",
            weight: 3,
            fillOpacity: 0.1,
          }).addTo(map);
        }
      } else if (drawMode === "circle") {
        if (tempLayer) {
          map.removeLayer(tempLayer);
        }
        tempLayer = L.circle(e.latlng, {
          radius: 500,
          color: "hsl(152 24% 42%)",
          weight: 3,
          fillOpacity: 0.1,
        }).addTo(map);

        const bounds = tempLayer.getBounds();
        const geometry = {
          type: "Polygon",
          coordinates: [[
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
            [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
            [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          ]],
        };

        drawnLayersRef.current.addLayer(tempLayer);
        onAreaSelected(geometry);
        setDrawMode(null);
      }
    };

    const handleMapDblClick = () => {
      if (drawMode === "polygon" && latlngs.length > 2) {
        if (tempLayer) {
          const geometry = {
            type: "Polygon",
            coordinates: [
              latlngs.map(ll => [ll.lng, ll.lat]).concat([[latlngs[0].lng, latlngs[0].lat]])
            ],
          };

          drawnLayersRef.current.addLayer(tempLayer);
          onAreaSelected(geometry);
          setDrawMode(null);
          latlngs = [];
        }
      }
    };

    map.on("click", handleMapClick);
    map.on("dblclick", handleMapDblClick);

    return () => {
      map.off("click", handleMapClick);
      map.off("dblclick", handleMapDblClick);
      if (tempLayer) {
        map.removeLayer(tempLayer);
      }
    };
  }, [drawMode, onAreaSelected]);

  // Render clusters
  useEffect(() => {
    if (!mapRef.current || !clusters) return;

    const map = mapRef.current;
    const clusterLayers: L.CircleMarker[] = [];

    clusters.forEach((cluster) => {
      const coords = cluster.geometry.coordinates[0][0];
      const color = 
        cluster.severity === "high" ? "hsl(0 65% 51%)" :
        cluster.severity === "medium" ? "hsl(38 92% 50%)" :
        "hsl(152 24% 42%)";

      const marker = L.circleMarker([coords[1], coords[0]], {
        radius: 12,
        color: color,
        weight: 3,
        fillOpacity: 0.3,
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-2">
          <strong class="font-bold">Walkability Score: ${cluster.metrics.score}</strong><br/>
          Severity: ${cluster.severity.toUpperCase()}<br/>
          Sidewalk Coverage: ${cluster.metrics.sidewalk_pct}%<br/>
          Intersection Density: ${cluster.metrics.intersection_density}/km²
        </div>
      `);

      clusterLayers.push(marker);
    });

    return () => {
      clusterLayers.forEach(layer => map.removeLayer(layer));
    };
  }, [clusters]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full brutalist-border" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        <Button
          variant={drawMode === "polygon" ? "default" : "outline"}
          size="icon"
          onClick={() => setDrawMode(drawMode === "polygon" ? null : "polygon")}
          className="brutalist-shadow bg-card"
          disabled={isAnalyzing}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={drawMode === "circle" ? "default" : "outline"}
          size="icon"
          onClick={() => setDrawMode(drawMode === "circle" ? null : "circle")}
          className="brutalist-shadow bg-card"
          disabled={isAnalyzing}
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            drawnLayersRef.current.clearLayers();
            setDrawMode(null);
          }}
          className="brutalist-shadow bg-card"
          disabled={isAnalyzing}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {drawMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card px-6 py-3 brutalist-border brutalist-shadow z-[1000]">
          <p className="text-sm font-bold">
            {drawMode === "polygon" 
              ? "Click to add points. Double-click to finish." 
              : "Click to place circular area"}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
