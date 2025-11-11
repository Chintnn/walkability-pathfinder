import { BackendCluster, FrontendCluster } from "@/types/backend";

/**
 * Converts backend clusters → frontend clusters for the map.
 * ✅ Handles flat [lat, lon] coordinates (from FastAPI)
 * 🧠 Adds safety checks and logs for debugging
 */
export const transformBackendClusters = (
  backendClusters: BackendCluster[]
): FrontendCluster[] => {
  console.log("🔥 Raw backend clusters:", backendClusters);

  return backendClusters.map((cluster) => {
    const coords = cluster.coordinates;

    // 🧩 Validate coordinates
    if (
      !Array.isArray(coords) ||
      coords.length !== 2 ||
      typeof coords[0] !== "number" ||
      typeof coords[1] !== "number"
    ) {
      console.warn("⚠️ Invalid or missing coordinates:", cluster);
      return {
        id: cluster.id.toString(),
        geometry: { coordinates: [0, 0] }, // placeholder to prevent crash
        severity: "low",
        metrics: {
          score: 0,
          name: `Invalid cluster ${cluster.id}`,
        },
      };
    }

    let [lat, lon] = coords; // ✅ backend sends [lat, lon]

    // 🧠 Auto-fix if coordinates are reversed
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
      console.warn(`⚠️ Reversing coordinates for cluster ${cluster.id}`);
      [lat, lon] = [lon, lat];
    }

    console.log(`✅ Cluster ${cluster.id} coords → lat=${lat}, lon=${lon}`);

    return {
      id: cluster.id.toString(),
      geometry: {
        coordinates: [lat, lon], // ✅ flat array only
      },
      severity:
        (cluster.risk_level?.toLowerCase() as "high" | "medium" | "low") ||
        "low",
      metrics: {
        score: getSeverityScore(cluster.risk_level),
        name: cluster.name || `Cluster ${cluster.id}`,
      },
    };
  });
};

/**
 * Convert risk level → numeric score
 */
const getSeverityScore = (riskLevel: string): number => {
  const normalized = riskLevel?.toLowerCase?.() || "low";
  if (normalized === "high") return 25;
  if (normalized === "medium") return 50;
  if (normalized === "low") return 75;
  return 50;
};
