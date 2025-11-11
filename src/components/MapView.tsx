import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  clusters?: Array<{
    id: string;
    geometry: any;
    severity: "high" | "medium" | "low";
    metrics: any;
  }>;
  selectedArea?: {
    lat: number;
    lon: number;
    boundingBox: number[][];
  };
}

const MapView = ({ clusters, selectedArea }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const selectedAreaLayerRef = useRef<L.Rectangle | null>(null);

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

    return () => {
      map.remove();
    };
  }, []);

  // Handle selected area display
  useEffect(() => {
    if (!mapRef.current || !selectedArea) return;

    const map = mapRef.current;

    // Remove previous selected area
    if (selectedAreaLayerRef.current) {
      map.removeLayer(selectedAreaLayerRef.current);
    }

    // Add new selected area
    const bounds: L.LatLngBoundsExpression = [
      [selectedArea.boundingBox[0][0], selectedArea.boundingBox[0][1]],
      [selectedArea.boundingBox[1][0], selectedArea.boundingBox[1][1]]
    ];

    selectedAreaLayerRef.current = L.rectangle(bounds, {
      color: "hsl(152 24% 42%)",
      weight: 3,
      fillOpacity: 0.1,
    }).addTo(map);

    // Fit map to bounds
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [selectedArea]);

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
    </div>
  );
};

export default MapView;
