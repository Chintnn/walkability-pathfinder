import { BackendCluster, FrontendCluster } from "@/types/backend";

/**
 * Transform backend cluster data to frontend format
 * Fix: Ensure coordinates are in [lat, lon] order for Leaflet
 */
export const transformBackendClusters = (
  backendClusters: BackendCluster[]
): FrontendCluster[] => {
  return backendClusters
    .filter(
      (cluster) =>
        Array.isArray(cluster.coordinates) &&
        cluster.coordinates.length === 2 &&
        typeof cluster.coordinates[0] === "number" &&
        typeof cluster.coordinates[1] === "number"
    )
    .map((cluster) => {
      const [lat, lon] = cluster.coordinates; // ✅ Backend already sends [lat, lon]

      return {
        id: cluster.id.toString(),
        geometry: {
          coordinates: [lat, lon], // ✅ Keep same order [lat, lon]
        },
        severity: cluster.risk_level
          ? cluster.risk_level.toLowerCase() as "high" | "medium" | "low"
          : "low",
        metrics: {
          score: getSeverityScore(cluster.risk_level || "low"),
          name: cluster.name || `Cluster ${cluster.id}`,
        },
      };
    });
};

/**
 * Convert risk level to numeric score
 */
const getSeverityScore = (riskLevel: string): number => {
  const normalized = riskLevel?.toLowerCase?.() || "low";
  if (normalized === "high") return 25;
  if (normalized === "medium") return 50;
  if (normalized === "low") return 75;
  return 50; // default
};
