export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => ({
    id: c.id || `cluster-${i}`,
    severity: c.severity || c.risk_level || "medium",
    metrics: {
      score: c.metrics?.score ?? c.walkability_score ?? 50,
      name: c.metrics?.name ?? "Walkability Issue",
    },
    coordinates:
      c.coordinates ||
      c.geometry?.coordinates ||
      [0, 0],
    description: c.description || "No description available",
  }));
};
