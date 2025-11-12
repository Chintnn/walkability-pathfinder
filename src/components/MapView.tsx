import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  clusters?: Array<{
    id: string;
    geometry?: { coordinates?: [number, number] };
    coordinates?: [number, number];
    severity?: "high" | "medium" | "low" | string;
    risk_level?: string;
    name?: string;
    description?: string;
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

  // Initialize the map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [12.9716, 77.5946], // Default center (Bangalore)
      zoom: 13,
      zoomControl: true,
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

  // Update markers when clusters change
  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    clusters.forEach((cluster) => {
      // Support both `geometry.coordinates` and `coordinates` directly
      const coords =
        cluster.coordinates ||
        (cluster.geometry?.coordinates as [number, number] | undefined);

      if (
        !coords ||
        coords.length !== 2 ||
        isNaN(coords[0]) ||
        isNaN(coords[1])
      ) {
        return; // skip invalid coordinates
      }

      const [lat, lon] = coords;
      const color =
        cluster.risk_level === "High" || cluster.severity === "high"
          ? "red"
          : cluster.risk_level === "Medium" || cluster.severity === "medium"
          ? "orange"
          : "green";

      const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        color: "black",
        weight: 1,
        fillOpacity: 0.8,
      }).bindPopup(
        `<b>${cluster.name || "Area"}</b><br/>Risk: ${
          cluster.risk_level || cluster.severity || "N/A"
        }<br/>${cluster.description || ""}`
      );

      marker.addTo(markerLayer);
    });
  }, [clusters]);

  // Optional: Center map when selectedArea changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedArea) return;

    const { lat, lon } = selectedArea;
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      map.setView([lat, lon], 15);
    }
  }, [selectedArea]);

  return (
    <div
      ref={mapContainer}
      id="map"
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
