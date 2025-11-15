import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  clusters?: Array<{
    id: string;
    coordinates: [number, number]; // [lat, lon]
    severity?: "high" | "medium" | "low";
    description?: string;
    metrics?: { score: number; name: string };
  }>;
  selectedArea?: {
    lat: number;
    lon: number;
    boundingBox?: number[][];
  };
}

const MapView = ({ clusters = [], selectedArea }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // 1️⃣ INIT MAP
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [12.9716, 77.5946],
      zoom: 14,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // 2️⃣ UPDATE MARKERS WHEN CLUSTERS CHANGE
  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    clusters.forEach((cluster) => {
      const [lat, lon] = cluster.coordinates;

      if (isNaN(lat) || isNaN(lon)) return;

      const color =
        cluster.severity === "high"
          ? "red"
          : cluster.severity === "medium"
          ? "orange"
          : "green";

      L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        color: "black",
        weight: 1,
        fillOpacity: 0.9,
      })
        .bindPopup(
          `
            <b>${cluster.metrics?.name || "Walkability Issue"}</b><br/>
            Severity: ${cluster.severity?.toUpperCase()}<br/>
            Score: ${cluster.metrics?.score || "N/A"}/100<br/>
            ${cluster.description || ""}
          `
        )
        .addTo(markerLayer);
    });
  }, [clusters]);

  // 3️⃣ CENTER MAP ON SELECTED AREA
  useEffect(() => {
    if (!mapRef.current || !selectedArea) return;

    const { lat, lon } = selectedArea;

    if (!isNaN(lat) && !isNaN(lon)) {
      mapRef.current.setView([lat, lon], 15);
    }
  }, [selectedArea]);

  return (
    <div
      ref={mapContainer}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
};

export default MapView;
