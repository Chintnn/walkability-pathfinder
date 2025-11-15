export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => ({
    id: c.id || `cluster-${i}`,
    severity: c.severity || "medium",
    metrics: {
      score: c.metrics?.score ?? 50,
      name: c.metrics?.name ?? "Unknown Area",
    },
    coordinates: c.coordinates || [0, 0],
    description: c.description || "No description available"
  }));
};
