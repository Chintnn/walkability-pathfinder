/**
 * API Configuration
 * 
 * Replace the BACKEND_URL with your deployed FastAPI endpoint URL
 * Examples:
 * - Local: "http://localhost:8000"
 * - ngrok: "https://your-ngrok-url.ngrok-free.app"
 * - Production: "https://your-domain.com"
 */

export const API_CONFIG = {
  // 🔧 REPLACE THIS with your FastAPI backend URL
  BACKEND_URL: "https://unhelpable-acridly-rylee.ngrok-free.dev",
  
  // API endpoints
  ENDPOINTS: {
    ANALYZE: "/analyze",
    HEALTH: "/health",
  },
};

/**
 * Get the full API URL for an endpoint
 */
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS): string => {
  return `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};
