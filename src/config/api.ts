/**
 * API Configuration
 * 
 * Replace BACKEND_URL with your FastAPI deployment URL.
 */

export const API_CONFIG = {
  // 🚀 Your FastAPI backend URL
  BACKEND_URL: "https://unhelpable-acridly-rylee.ngrok-free.dev",

  // IMPORTANT — Separate GET and POST analyze endpoints
  ENDPOINTS: {
    ANALYZE_POST: "/analyze",   // POST → Analysis JSON
    ANALYZE_GET: "/analyze",    // GET → Map preview HTML
    HEALTH: "/health",
  },
};

/**
 * Helper to build complete URL for API calls
 */
export const getApiUrl = (
  endpoint: keyof typeof API_CONFIG.ENDPOINTS
): string => {
  return `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};
