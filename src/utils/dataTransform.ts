export const transformBackendClusters = (clusters: any[]) => {
  if (!Array.isArray(clusters)) return [];

  return clusters.map((c, i) => {
    // -------------------------------
    // 1️⃣ Extract coordinates
    // -------------------------------
    const lat = Number(c.lat ?? 0);
    const lon = Number(c.lon ?? 0);

    const coords: [number, number] = [lat, lon];

    // -------------------------------
    // 2️⃣ Extract walkability score
    // -------------------------------
    const score =
      c.walkability_score_normalized ??
      c.walkability_score ??
      c.metrics?.score ??
      50;

    const roundedScore = Math.round(Number(score) || 50);

    // -------------------------------
    // 3️⃣ Severity (matches backend)
    // -------------------------------
    const severity =
      c.severity ??
      (roundedScore < 33
        ? "high"
        : roundedScore < 66
        ? "medium"
        : "low");

    // -------------------------------
    // 4️⃣ Build final cluster object
    // -------------------------------
    return {
      id: c.id ?? `cluster-${i}`,
      severity,
      metrics: {
        score: roundedScore,
        name: c.name ?? "Walkability Issue",
      },
      coordinates: coords,
      description: c.description ?? "No description available",
    };
  });
};
