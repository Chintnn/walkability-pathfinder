export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => {
    // Coordinates from backend
    const coords: [number, number] = 
      c.coordinates ||
      c.geometry?.coordinates ||
      (c.lat && c.lon ? [c.lat, c.lon] : [0, 0]);

    // Use backend walkability score
    const score = 
      c.walkability_score_normalized ??
      c.walkability_score ??
      c.metrics?.score ??
      50;

    // Severity normalized
    const severity = 
      c.severity || 
      c.risk_level || 
      (score < 33 ? "high" : score < 66 ? "medium" : "low");

    return {
      id: c.id || `cluster-${i}`,
      severity,
      metrics: {
        score: Math.round(score),
        name: c.metrics?.name ?? "Walkability Issue"
      },
      coordinates: coords,
      description: c.description || "No description available"
    };
  });
};
