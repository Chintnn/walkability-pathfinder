export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => {
    // Extract coordinates from Shapely Point (backend)
    let coords: [number, number] = [0, 0];
    try {
      if (c.geometry && c.geometry.coordinates) {
        // Backend sends [lon, lat]
        coords = [c.geometry.coordinates[1], c.geometry.coordinates[0]];
      }
    } catch {}

    // Extract score properly
    const score =
      c.walkability_score_normalized ??
      c.walkability_score ??
      c.score ?? // <-- backend recommendation score
      50;

    // Convert to severity
    const severity =
      score < 33 ? "high"
      : score < 66 ? "medium"
      : "low";

    return {
      id: c.id ?? `cluster-${i}`,
      severity,
      metrics: {
        score: Math.round(score),
        name: c.description ?? "Walkability Issue",
      },
      coordinates: coords,
      description: c.description ?? "No description available",
    };
  });
};
