/**
 * Backend API Types
 * These match the FastAPI backend response structure
 */

export interface BackendCluster {
  id: number;
  name: string;
  risk_level: string; // "High" | "Medium" | "Low"
  coordinates: [number, number]; // [lat, lon]
}

export interface BackendAnalysisResponse {
  message: string;
  clusters: BackendCluster[];
}

/**
 * Frontend data types (transformed from backend)
 */
export interface FrontendCluster {
  id: string;
  geometry: {
    coordinates: [[number, number]];
  };
  severity: "high" | "medium" | "low";
  metrics: {
    score: number;
    name: string;
  };
}
