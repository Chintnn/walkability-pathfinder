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

  // 🗺️ Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [12.9716, 77.5946], // Default: Bangalore
      zoom: 13,
      zoomControl: false,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // 🟩 Draw selected bounding box
  useEffect(() => {
    if (!mapRef.current || !selectedArea) return;
    const map = mapRef.current;

    if (selectedAreaLayerRef.current) {
      map.removeLayer(selectedAreaLayerRef.current);
    }

    const bounds: L.LatLngBoundsExpression = [
      [selectedArea.boundingBox[0][0], selectedArea.boundingBox[0][1]],
      [selectedArea.boundingBox[1][0], selectedArea.boundingBox[1][1]],
    ];

    selectedAreaLayerRef.current = L.rectangle(bounds, {
      color: "hsl(152 24% 42%)",
      weight: 3,
      fillOpacity: 0.1,
    }).addTo(map);

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [selectedArea]);

  // 🔴 Draw clusters safely
  useEffect(() => {
    if (!mapRef.current || !clusters) return;

    const map = mapRef.current;
    const clusterLayers: L.CircleMarker[] = [];

    clusters.forEach((cluster) => {
      if (!cluster?.geometry?.coordinates) return;

      // Handle both flat and nested coordinate formats
      let rawCoords = cluster.geometry.coordinates;
      if (Array.isArray(rawCoords[0])) rawCoords = rawCoords[0]; // unwrap one level
      if (Array.isArray(rawCoords[0])) rawCoords = rawCoords[0]; // unwrap twice if needed

      let [lat, lon] = rawCoords;

      // Auto-swap if order is reversed (lon first)
      if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
        [lat, lon] = [lon, lat];
      }

      // Validate coordinates
      if (!isFinite(lat) || !isFinite(lon)) {
        console.warn("Skipping invalid cluster coordinates:", cluster);
        return;
      }

      const color =
        cluster.severity === "high"
          ? "hsl(0 65% 51%)"
          : cluster.severity === "medium"
          ? "hsl(38 92% 50%)"
          : "hsl(152 24% 42%)";

      const marker = L.circleMarker([lat, lon], {
        radius: 12,
        color: color,
        weight: 3,
        fillOpacity: 0.3,
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-2">
          <strong class="font-bold">${cluster.metrics?.name || "Unknown"}</strong><br/>
          <span style="color: ${color}">
            Severity: ${cluster.severity?.toUpperCase() || "N/A"}
          </span><br/>
          Walkability Score: ${cluster.metrics?.score ?? "?"}/100
        </div>
      `);

      clusterLayers.push(marker);
    });

    return () => {
      clusterLayers.forEach((layer) => map.removeLayer(layer));
    };
  }, [clusters]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full brutalist-border" />
    </div>
  );
};

export default MapView;
