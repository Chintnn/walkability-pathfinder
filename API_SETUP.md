# FastAPI Backend Integration Guide

## Quick Start

### 1. Configure Your API URL

Edit `src/config/api.ts` and replace the `BACKEND_URL` with your FastAPI endpoint:

```typescript
export const API_CONFIG = {
  // 🔧 Replace with your actual backend URL
  BACKEND_URL: "https://your-backend-url.com",  // or ngrok URL
  
  ENDPOINTS: {
    ANALYZE: "/analyze",
    HEALTH: "/health",
  },
};
```

### 2. Backend Requirements

Your FastAPI backend must have the following endpoints:

#### POST `/analyze`
**Request Body:**
```json
{
  "lat": 12.9716,
  "lon": 77.5946
}
```

**Response:**
```json
{
  "message": "Analysis completed successfully!",
  "clusters": [
    {
      "id": 1,
      "name": "Sidewalk gap near intersection",
      "risk_level": "High",  // "High", "Medium", or "Low"
      "coordinates": [12.972, 77.595]  // [lat, lon]
    }
  ]
}
```

#### GET `/health`
**Response:**
```json
{
  "status": "healthy",
  "message": "Backend is running"
}
```

### 3. CORS Configuration

Make sure your FastAPI has CORS enabled:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Test Connection

1. Start your FastAPI backend
2. Open the app
3. The system will automatically call your `/analyze` endpoint when you search for a location

## Frontend Data Flow

1. **User searches** for location (e.g., "Sarjapur, Bangalore")
2. **Frontend geocodes** location using OpenStreetMap Nominatim API
3. **Frontend sends** lat/lon coordinates to your `/analyze` endpoint
4. **Backend processes** the request and returns walkability clusters
5. **Frontend displays** clusters on map and analysis panel

## Files to Know

- **`src/config/api.ts`** - API configuration (update your URL here)
- **`src/pages/Index.tsx`** - Main page that calls your API
- **`src/types/backend.ts`** - TypeScript types for API responses
- **`src/utils/dataTransform.ts`** - Transforms backend data for frontend
- **`src/components/MapView.tsx`** - Displays clusters on map
- **`src/components/AnalysisPanel.tsx`** - Shows analysis results

## Troubleshooting

### Connection Failed
- Check that your backend is running
- Verify the URL in `src/config/api.ts` is correct
- Check CORS is enabled on your backend
- Test the `/health` endpoint directly in your browser

### No Clusters Showing
- Check browser console for errors
- Verify your backend is returning the correct response format
- Make sure `risk_level` is "High", "Medium", or "Low" (case-sensitive)
- Check coordinates are in [lat, lon] format

### ngrok Issues
- Make sure ngrok is running
- Update the URL in `src/config/api.ts` when ngrok URL changes
- Add `ngrok-skip-browser-warning: true` header if needed
