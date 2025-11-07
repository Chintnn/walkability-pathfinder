export const generateMockAnalysisData = () => {
  return {
    clusters: [
      {
        id: "C1",
        severity: "high" as const,
        geometry: {
          type: "Polygon",
          coordinates: [[[77.595, 12.935], [77.596, 12.935], [77.596, 12.934], [77.595, 12.934], [77.595, 12.935]]]
        },
        metrics: {
          score: 32,
          sidewalk_pct: 15,
          intersection_density: 45,
          amenity_distance: 850
        }
      },
      {
        id: "C2",
        severity: "medium" as const,
        geometry: {
          type: "Polygon",
          coordinates: [[[77.597, 12.937], [77.598, 12.937], [77.598, 12.936], [77.597, 12.936], [77.597, 12.937]]]
        },
        metrics: {
          score: 58,
          sidewalk_pct: 45,
          intersection_density: 62,
          amenity_distance: 420
        }
      },
      {
        id: "C3",
        severity: "high" as const,
        geometry: {
          type: "Polygon",
          coordinates: [[[77.593, 12.933], [77.594, 12.933], [77.594, 12.932], [77.593, 12.932], [77.593, 12.933]]]
        },
        metrics: {
          score: 28,
          sidewalk_pct: 10,
          intersection_density: 38,
          amenity_distance: 920
        }
      }
    ],
    recommendations: [
      {
        id: "R1",
        title: "Add Mid-Block Crossing",
        impact: "+12% Walkability",
        cost: "LOW",
        description: "Install zebra crossing and tactile paving at high-pedestrian intersection."
      },
      {
        id: "R2",
        title: "Sidewalk Extension",
        impact: "+18% Accessibility",
        cost: "MEDIUM",
        description: "Extend sidewalk coverage along 200m corridor with proper drainage."
      },
      {
        id: "R3",
        title: "Traffic Calming Measures",
        impact: "+8% Safety",
        cost: "LOW",
        description: "Install speed bumps and signage in residential zone."
      },
      {
        id: "R4",
        title: "Green Buffer Zone",
        impact: "+15% Comfort",
        cost: "MEDIUM",
        description: "Plant trees and create buffer between pedestrian and vehicle zones."
      }
    ],
    impact: {
      co2_reduction: 12,
      accessibility_increase: 24,
      walkability_improvement: 18
    }
  };
};
