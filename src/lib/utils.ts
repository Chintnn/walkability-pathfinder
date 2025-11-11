import { BackendCluster, FrontendCluster } from "@/types/backend";

/**
 * Converts backend clusters → frontend clusters for the map.
 * ✅ Backend already sends coordinates as [lat, lon]
 */
export const transformBackendClusters = (
  backendClusters: BackendCluster[]
): FrontendCluster[] => {
  return backendClusters.map((cluster) => {
    const [lat, lon] = cluster.coordinates; // ✅ backend sends [lat, lon]

    return {
      id: cluster.id.toString(),
      geometry: {
        coordinates: [lat, lon], // ✅ no extra array nesting
      },
      severity: (cluster.risk_level?.toLowerCase() as
        | "high"
        | "medium"
        | "low") || "low",
      metrics: {
        score: getSeverityScore(cluster.risk_level),
        name: cluster.name || `Cluster ${cluster.id}`,
      },
    };
  });
};

/** Convert risk level → numeric score */
const getSeverityScore = (riskLevel: string): number => {
  const normalized = riskLevel?.toLowerCase?.() || "low";
  if (normalized === "high") return 25;
  if (normalized === "medium") return 50;
  return 75; // low = best
};
