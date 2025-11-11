import { BackendCluster, FrontendCluster } from "@/types/backend";

/**
 * Transform backend cluster data to frontend format
 * Guarantees valid [lat, lon] for Leaflet
 */
export const transformBackendClusters = (
  backendClusters: BackendCluster[]
): FrontendCluster[] => {
  return backendClusters
    .map((cluster) => {
      const coords = cluster.coordinates ?? [];

      // Validate coordinates
      let lat = Number(coords[0]);
      let lon = Number(coords[1]);

      // Auto-swap if backend accidentally sent [lon, lat]
      if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
        [lat, lon] = [lon, lat];
      }

      // Skip invalid coordinates
      if (!isFinite(lat) || !isFinite(lon)) return null;

      return {
        id: cluster.id?.toString() || crypto.randomUUID(),
        geometry: {
          coordinates: [lat, lon] as [number, number],
        },
        severity: (cluster.risk_level || "Low").toLowerCase() as
          | "high"
          | "medium"
          | "low",
        metrics: {
          score: getSeverityScore(cluster.risk_level || "Low"),
          name: cluster.name || `Cluster ${cluster.id}`,
        },
      };
    })
    .filter(Boolean) as FrontendCluster[];
};

/**
 * Convert textual risk level to numeric score (0–100)
 */
const getSeverityScore = (riskLevel: string): number => {
  const normalized = (riskLevel || "low").toLowerCase();
  switch (normalized) {
    case "high":
      return 25;
    case "medium":
      return 50;
    case "low":
      return 75;
    default:
      return 50;
  }
};
