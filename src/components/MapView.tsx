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
      center: [12.9716, 77.5946], // Default center (Bangalore)
      zoom: 13,
      zoomControl: false,
    });

    mapRef.current = map;

    // Add OSM tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // 🟩 Display selected bounding area
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

  // 🔴 Render walkability clusters safely
  useEffect(() => {
    if (!mapRef.current || !clusters) return;
    const map = mapRef.current;
    const clusterLayers: L.CircleMarker[] = [];

    console.log("🌍 Incoming clusters:", clusters);

    clusters.forEach((cluster) => {
      const coords = cluster.geometry?.coordinates;

      console.log("🧩 MapView received coords:", coords);

      // Validate coordinate format
      if (
        !coords ||
        !Array.isArray(coords) ||
        coords.length !== 2 ||
        typeof coords[0] !== "number" ||
        typeof coords[1] !== "number"
      ) {
        console.warn("⚠️ Skipping cluster with invalid coords:", cluster);
        return;
      }

      const [lat, lon] = coords;

      // Skip invalid or NaN
      if (!isFinite(lat) || !isFinite(lon)) {
        console.warn("⚠️ Invalid lat/lon, skipping cluster:", cluster);
        return;
      }

      console.log(`✅ Valid cluster ${cluster.id}: lat=${lat}, lon=${lon}`);

      const color =
        cluster.severity === "high"
          ? "hsl(0 65% 51%)"
          : cluster.severity === "medium"
          ? "hsl(38 92% 50%)"
          : "hsl(152 24% 42%)";

      const marker = L.circleMarker([lat, lon], {
        radius:
          cluster.severity === "high"
            ? 14
            : cluster.severity === "medium"
            ? 10
            : 8,
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

    // Cleanup
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
