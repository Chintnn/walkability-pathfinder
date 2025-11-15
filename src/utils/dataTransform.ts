export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => {
    // ⭐ Extract coordinates safely
    let coords: [number, number] = [0, 0];

    if (Array.isArray(c.coordinates) && c.coordinates.length === 2) {
      coords = c.coordinates as [number, number];
    } else if (Array.isArray(c.geometry?.coordinates)) {
      coords = c.geometry.coordinates as [number, number];
    } else if (typeof c.lat === "number" && typeof c.lon === "number") {
      coords = [c.lat, c.lon];
    }

    // ⭐ Fallback metrics
    const score = c.metrics?.score ?? c.walkability_score ?? 50;
    const name = c.metrics?.name ?? c.name ?? "Walkability Issue";

    return {
      id: c.id || `cluster-${i}`,
      severity: c.severity || c.risk_level || "medium",
      metrics: {
        score,
        name,
      },
      coordinates: coords,
      description: c.description || c.note || "No description available",
    };
  });
};
