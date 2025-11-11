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

  // 🗺️ Initialize the map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [12.9716, 77.5946], // Default: Bangalore
      zoom: 13,
      zoomControl: false,
    });

    mapRef.current = map;

    // Add base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    return () => map.remove();
  }, []);

  // 🟩 Show selected area
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

  // 🔴 Render clusters (with safety and debug logging)
  useEffect(() => {
    if (!mapRef.current || !clusters) return;

    const map = mapRef.current;
    const clusterLayers: L.CircleMarker[] = [];

    console.log("🌍 Incoming clusters:", clusters);

    clusters.forEach((cluster) => {
      console.log("🧩 Processing cluster:", cluster);

      let coords: any = cluster.geometry?.coordinates;

      // Handle both shapes: [lat, lon] or [[lat, lon]]
      if (!coords) {
        console.warn("⚠️ Missing coordinates:", cluster);
        return;
      }

      if (Array.isArray(coords[0])) {
        coords = coords[0]; // unwrap if nested
      }

      let [lat, lon] = coords || [];

      // Auto-fix if [lon, lat] was sent accidentally
      if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
        [lat, lon] = [lon, lat];
      }

      // Skip invalid or undefined coords
      if (!isFinite(lat) || !isFinite(lon)) {
        console.warn("⚠️ Invalid coords, skipping cluster:", cluster);
        return;
      }

      console.log(`✅ Valid coords for ${cluster.id}: lat=${lat}, lon=${lon}`);

      const color =
        cluster.severity === "high"
          ? "hsl(0 65% 51%)"
          : cluster.severity === "medium"
          ? "hsl(38 92% 50%)"
          : "hsl(152 24% 42%)";

      const marker = L.circleMarker([lat, lon], {
        radius: cluster.severity === "high" ? 14 : cluster.severity === "medium" ? 10 : 8,
        color,
        weight: 3,
        fillOpacity: 0.3,
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-2">
          <strong>${cluster.metrics?.name || "Unknown Cluster"}</strong><br/>
          <span style="color:${color}">
            Severity: ${cluster.severity?.toUpperCase() || "N/A"}
          </span><br/>
          Walkability Score: ${cluster.metrics?.score ?? "?"}/100
        </div>
      `);

      clusterLayers.push(marker);
    });

    // Cleanup markers on update
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
