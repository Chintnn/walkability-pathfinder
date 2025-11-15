# Walkability Pathfinder

**Walkability Pathfinder** is an open-source tool for analyzing walkability and finding pedestrian-friendly routes on city maps. It leverages geographic data (e.g., OpenStreetMap) and graph algorithms to compute optimal walking paths between locations, taking into account factors like street connectivity and sidewalk availability. In short, it helps users identify routes that are safe and convenient for walking.

Walkability is generally defined as **“how friendly an area is to walking”**, influenced by factors like the presence and quality of sidewalks, traffic conditions, land use, and safety (making-cities-safer.com). A key insight is that **dense, well-connected street networks tend to be more walkable** – areas with high intersection density offer diverse and efficient routes for pedestrians (github.com).

Walkability Pathfinder builds a graph of the pedestrian network (using tools like **OSMnx** (pypi.org) and **GeoPandas** (geopandas.org)), runs pathfinding algorithms (such as Dijkstra/A*), and can optionally incorporate machine learning models to rate sidewalk quality. The result is an interactive map or report showing the best walking paths and associated walkability metrics.

---

## How It Works

### **1. Data Input**

The system ingests geospatial data for the area of interest, typically from **OpenStreetMap (OSM)** (pypi.org).
Data may include:

* Roads
* Footpaths
* Points of Interest
* Sidewalk attributes

Additional sources (surveys, satellite imagery, etc.) can also be integrated.

---

### **2. Data Processing**

Raw map data is processed to construct a **pedestrian network graph**.

Tools used:

* **OSMnx** – download & model walkable street networks (pypi.org)
* **GeoPandas / Shapely** – manipulate and clean geographic features (geopandas.org)

Nodes represent intersections or endpoints, and edges represent walkable street segments.
The graph may be simplified (e.g., removing dead-ends, merging nearby nodes) so only real intersections remain (github.com).

---

### **3. Walkability Scoring (Optional)**

If a model is provided, the tool can rate segments/intersections by walkability.
This may involve:

* Computer vision on street-view images
* Heuristics (sidewalk width, traffic, greenery, amenities)
* ML-based sidewalk quality predictions

Scores are stored as weights on graph edges.

---

### **4. Pathfinding**

Given start and end coordinates or addresses, the tool calculates the optimal pedestrian route.

Algorithms:

* **Dijkstra**
* **A***

Routing libraries:

* **NetworkX** (via OSMnx)
* **Pandana** for large-scale speed (pypi.org)

Edge weights can blend **distance + walkability score** to favor pedestrian-friendly paths.

---

### **5. Output**

The tool outputs:

* Polyline route
* Distance and estimated walking time
* Walkability score/index
* Interactive map visualization
* Summary statistics (crossings, elevation, proximity to parks)

Users can interact with a UI (if provided) to adjust parameters like avoiding busy streets or including green spaces.

---

## Architecture

```
+--------------+      +--------------------+      +--------------------------+
|              |      |                    |      |                          |
| Data Sources +----->+   Data Processing  +----->+  Graph & Walkability     |
| (OSM, GIS,   |      |   & ETL Pipeline   |      |  Analysis Engine         |
|  imagery, etc)|      | (OSMnx, GeoPandas)|      | (Pathfinding, Model)     |
|              |      |                    |      |                          |
+--------------+      +--------------------+      +------+-------------------+
                                                             |
                                                             v
                                              +-----------------------------+
                                              |                             |
                                              |       API Server / UI       |
                                              |   (Flask/Django + Frontend) |
                                              |                             |
                                              +-----------------------------+
```

### Components

* **Data Sources**: OSM (pypi.org), GIS datasets
* **Data Processing/ETL**: OSMnx, GeoPandas
* **Graph & Analysis Engine**: NetworkX, Pandana
* **API & Frontend**: Flask/Django + Leaflet or similar

Low-level services:

```
[ Geospatial DB (PostGIS) ] <-> [ Data Ingestion Service ]
                                 (imports OSM features)

[ ML Service or Model ]       [ Pathfinding Service ]
   (if used)                  (runs Dijkstra/A*)

[ REST API (Flask/Django) ] ----------------> [ Frontend (Leaflet/React) ]
```

All components may run in Docker containers or cloud functions.

---

## Project Structure

```
data/           # Raw and processed geospatial data
models/         # ML model files
app/ or src/    # Application source code
  main.py
  routes/
  utils/
  pathfinder.py # Core pathfinding logic
frontend/       # Web UI (HTML/CSS/JS)
notebooks/      # Jupyter examples
requirements.txt
Dockerfile
README.md
.env.example
```

---

## Workflow

### **1. Data Preparation**

```
python scripts/download_osm.py --bbox "lat_min,lon_min,lat_max,lon_max"
```

### **2. Precompute Metrics (optional)**

```
python scripts/compute_walkability.py --model models/walk_model.pkl
```

### **3. Run Server**

```
flask run
# or
python app.py
```

### **4. User Query**

```
curl "http://localhost:5000/route?start=lat1,lon1&end=lat2,lon2"
```

### **5. Front-end Interaction**

Interactive map loads route overlays, displays statistics, etc.

---

## Example Output

```json
{
  "distance": 1200,
  "duration": 900,
  "walk_score": 87,
  "path": [[37.7749,-122.4194], [37.7790,-122.4150], ...]
}
```

---

## Deployment

### **Docker**

```
docker build -t walkability-pathfinder .
docker run -p 80:5000 walkability-pathfinder
```

### **Cloud Platforms**

Heroku, AWS, Azure
Ensure environment variables and map API keys are configured.

### **Scaling**

* Use PostGIS for large areas
* Use Gunicorn for multi-process deployment
* Cron jobs for OSM updates

---

## Usage Examples

### **Web UI**

Click to select start/end points and view recommended route.

### **CLI**

```
python pathfinder.py --start "San Francisco, CA" --end "Market St, CA" --mode walk
```

Output:

```
Distance: 1.2 km, Time: 15 min, Walkability Score: 91/100
```

### **API**

```
curl -X GET "http://localhost:5000/api/route?start_lat=37.77&start_lon=-122.42&end_lat=37.78&end_lon=-122.41"
```

API Response:

```json
{
  "route_length_m": 1250,
  "estimated_time_s": 900,
  "walkability_index": 85,
  "polyline": "encoded_or_coordinates"
}
```

### **Visualization Export**

```
python pathfinder.py --export-filename route.geojson --coordinates "37.77,-122.42;37.78,-122.41"
```

---

## Extra Info

### Walkability Metrics

The project may integrate:

* Walk Score-style metrics
* Green space access
* Street lighting
* Elevation/hilliness

### Similar Projects

* Walk Score
* OSMnx (github.com, pypi.org)

### Limitations

* Depends on OSM data quality
* Sidewalk tagging inconsistent in many places
* Most walkable route may not be shortest

### Extensibility

Add factors like:

* Elevation
* Air quality
* Traffic noise

### Collaboration

Issues and PRs via GitHub.

---

## Sources

Based on open geospatial tools and research:

* **OSMnx** (pypi.org)
* **Pandana** (pypi.org)
* **GeoPandas** (geopandas.org)
* Walkability research (intersection density correlations, github.com)
* Urban safety studies (making-cities-safer.com)

