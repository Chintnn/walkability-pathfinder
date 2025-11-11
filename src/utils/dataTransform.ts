import { BackendCluster, FrontendCluster } from "@/types/backend";

/**
 * Transform backend cluster data to frontend format
 */
export const transformBackendClusters = (
  backendClusters: BackendCluster[]
): FrontendCluster[] => {
  return backendClusters.map((cluster) => ({
    id: cluster.id.toString(),
    geometry: {
      coordinates: [[cluster.coordinates[0], cluster.coordinates[1]]], // Convert to [lon, lat] for GeoJSON
    },
    severity: cluster.risk_level.toLowerCase() as "high" | "medium" | "low",
    metrics: {
      score: getSeverityScore(cluster.risk_level),
      name: cluster.name,
    },
  }));
};

/**
 * Convert risk level to numeric score
 */
const getSeverityScore = (riskLevel: string): number => {
  const normalized = riskLevel.toLowerCase();
  if (normalized === "high") return 25;
  if (normalized === "medium") return 50;
  if (normalized === "low") return 75;
  return 50; // default
};
