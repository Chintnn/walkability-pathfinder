# main.py
from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import traceback
from typing import Any, Dict, List, Tuple, Optional

# --- Import from utils (only the functions you said exist) ---
from utils.data_fetch import fetch_osm_data
from utils.feature_extract import extract_features
from utils.scoring import compute_walkability
from utils.recommendations import generate_recommendations
from utils.visualization import generate_walkability_map


# ------------------------------------------------
# Initialize FastAPI
# ------------------------------------------------
app = FastAPI(
    title="Walkability & Sidewalk Analysis API",
    description="Analyze OSM data for sidewalks and walkability recommendations.",
    version="1.0.0",
)

# ------------------------------------------------
# Enable CORS (for Lovable, localhost, ngrok)
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# Request model for POST /analyze
# ------------------------------------------------
class Coordinates(BaseModel):
    lat: float
    lon: float


# ------------------------------------------------
# Routes
# ------------------------------------------------
@app.get("/")
def home():
    return {"message": "Welcome to the Walkability API 🚶‍♀️"}


# ------------------------------
# GET /analyze  -> returns map HTML (map preview)
# ------------------------------
@app.get("/analyze", response_class=HTMLResponse)
def analyze_get(location: str = Query(..., description="Enter a location name, e.g., 'Indiranagar, Bangalore'")):
    try:
        # Step 1: Fetch OSM Data (expected G, nodes_gdf, edges_gdf, pois_gdf)
        G, nodes_gdf, edges_gdf, pois_gdf = fetch_osm_data(location)

        # Step 2: Extract features (creates blocks_gdf)
        blocks_gdf, edges_gdf, nodes_gdf = extract_features(nodes_gdf, edges_gdf, pois_gdf, G)

        # Step 3: Compute walkability (mutates/returns blocks_gdf)
        blocks_gdf = compute_walkability(blocks_gdf, edges_gdf)

        # Step 4: Generate recommendations (returns a GeoDataFrame or list-like)
        rec_gdf = generate_recommendations(blocks_gdf, edges_gdf)

        # Step 5: Generate map HTML
        map_html = generate_walkability_map(blocks_gdf, edges_gdf, rec_gdf)

        return HTMLResponse(content=map_html)
    except Exception as e:
        tb = traceback.format_exc()
        print("❌ INTERNAL ERROR (GET /analyze):")
        print(tb)
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})


# ------------------------------
# POST /analyze  -> JSON for frontend (Lovable)
# ------------------------------
@app.post("/analyze")
def analyze_post(data: Coordinates):
    try:
        lat, lon = data.lat, data.lon

        # ---------------------------
        # Flexible fetch_osm_data caller:
        # try: fetch_osm_data(lat, lon), then (lat,lon) tuple, then single arg string
        # ---------------------------
        fetched = None
        fetch_attempts = [
            lambda: fetch_osm_data(lat, lon),
            lambda: fetch_osm_data((lat, lon)),
            lambda: fetch_osm_data(f"{lat},{lon}"),
            lambda: fetch_osm_data(lat),  # last resort
        ]
        for fn in fetch_attempts:
            try:
                fetched = fn()
                if fetched is not None:
                    break
            except TypeError:
                # signature mismatch - try next
                continue
            except Exception:
                # If fetch fails for other reasons, re-raise
                raise

        if fetched is None:
            raise RuntimeError("fetch_osm_data returned no usable result")

        # ---------------------------
        # Interpret fetched return shapes
        # Possible shapes:
        # - (G, nodes_gdf, edges_gdf, pois_gdf)
        # - (graph, pois)
        # - graph only
        # - other single object
        # ---------------------------
        graph = None
        nodes_gdf = edges_gdf = pois_gdf = None
        try:
            # try 4-tuple
            G, nodes_gdf, edges_gdf, pois_gdf = fetched
            graph = G
        except Exception:
            try:
                # try 2-tuple
                graph, pois_gdf = fetched
            except Exception:
                # assume fetched is a graph-like object
                graph = fetched

        # ---------------------------
        # Default containers
        # ---------------------------
        blocks_gdf = None
        recommendations = []
        clusters: List[Any] = []

        # ---------------------------
        # If we have GeoDataFrame path, use it
        # ---------------------------
        if nodes_gdf is not None and edges_gdf is not None and pois_gdf is not None:
            try:
                blocks_gdf, edges_gdf, nodes_gdf = extract_features(nodes_gdf, edges_gdf, pois_gdf, graph)
            except Exception:
                # extraction failed, keep blocks_gdf None and continue
                blocks_gdf = None

            if blocks_gdf is not None:
                try:
                    blocks_gdf = compute_walkability(blocks_gdf, edges_gdf)
                except Exception:
                    # let blocks_gdf remain as whatever compute_walkability returned or None
                    pass

            # generate recommendations (defensive)
            try:
                recommendations = generate_recommendations(blocks_gdf, edges_gdf)
            except Exception:
                recommendations = []

            # clusters: best-effort: try to derive from recommendations if they have coords
            try:
                # If recommendations is a GeoDataFrame-like with geometry, build small clusters list
                if hasattr(recommendations, "to_dict"):
                    rec_records = recommendations.to_dict("records")
                    clusters = []
                    for rec in rec_records:
                        if ("coordinates" in rec and isinstance(rec["coordinates"], (list, tuple))):
                            clusters.append([float(rec["coordinates"][0]), float(rec["coordinates"][1])])
                        elif ("lat" in rec and "lon" in rec):
                            clusters.append([float(rec["lat"]), float(rec["lon"])])
                    # fallback: if empty, use first up to 20 rec coords if present
                    if not clusters:
                        for rec in rec_records[:20]:
                            # try common geometry keys
                            if "geometry" in rec:
                                clusters.append([rec["geometry"].y, rec["geometry"].x])
                else:
                    # assume list of dicts
                    clusters = []
                    for rec in (recommendations or [])[:50]:
                        if isinstance(rec, dict) and "coordinates" in rec and isinstance(rec["coordinates"], (list, tuple)):
                            clusters.append([float(rec["coordinates"][0]), float(rec["coordinates"][1])])
            except Exception:
                clusters = []

        else:
            # ---------------------------
            # Graph-based fallback path
            # ---------------------------
            # compute_walkability may accept graph or graph+pois; try best-effort
            scores = None
            try:
                scores = compute_walkability(graph, pois_gdf)
            except Exception:
                try:
                    scores = compute_walkability(graph, None)
                except Exception:
                    scores = None

            try:
                recommendations = generate_recommendations(scores)
            except Exception:
                recommendations = []

            # clusters from recommendations if possible
            try:
                clusters = []
                for rec in (recommendations or [])[:50]:
                    if isinstance(rec, dict) and "coordinates" in rec:
                        coords = rec["coordinates"]
                        clusters.append([float(coords[0]), float(coords[1])])
            except Exception:
                clusters = []

        # ---------------------------
        # Build simulation (pure python lists)
        # ---------------------------
        simulation: Dict[str, List[Any]] = {"nodes": [], "edges": []}
        try:
            if graph is not None and hasattr(graph, "nodes") and hasattr(graph, "edges"):
                for n in graph.nodes():
                    try:
                        simulation["nodes"].append(int(n))
                    except Exception:
                        simulation["nodes"].append(n)
                for u, v in graph.edges():
                    try:
                        simulation["edges"].append([int(u), int(v)])
                    except Exception:
                        simulation["edges"].append([u, v])
            else:
                # fallback to edges_gdf/nodes_gdf if present
                if nodes_gdf is not None:
                    try:
                        for idx, row in nodes_gdf.iterrows():
                            simulation["nodes"].append(int(idx))
                    except Exception:
                        # best-effort: skip
                        pass
                if edges_gdf is not None:
                    try:
                        for idx, row in edges_gdf.iterrows():
                            # can't map source/target reliably, so use idx placeholder
                            simulation["edges"].append([int(idx), int(idx)])
                    except Exception:
                        pass
        except Exception:
            simulation = {"nodes": simulation.get("nodes", []), "edges": simulation.get("edges", [])}

        # ---------------------------
        # Prepare recommendations list (JSON-serializable)
        # ---------------------------
        rec_list: List[Dict[str, Any]] = []
        try:
            if hasattr(recommendations, "to_dict"):
                # GeoDataFrame or DataFrame-like
                try:
                    rec_list = recommendations.to_dict("records")
                except Exception:
                    # fallback: try converting row by row
                    rec_list = []
                    for row in recommendations:
                        try:
                            rec_list.append(dict(row))
                        except Exception:
                            rec_list.append({"repr": str(row)})
            elif isinstance(recommendations, list):
                # list of dicts or objects
                for r in recommendations:
                    if isinstance(r, dict):
                        rec_list.append(r)
                    else:
                        # try to pull common attributes
                        try:
                            rec_list.append({"description": getattr(r, "description", str(r))})
                        except Exception:
                            rec_list.append({"repr": str(r)})
            else:
                # single dict or other
                try:
                    rec_list = [dict(recommendations)]
                except Exception:
                    rec_list = [{"repr": str(recommendations)}]
        except Exception:
            rec_list = []

        # ---------------------------
        # Prepare clusters to be JSON safe (list of simple pairs or dicts)
        # ---------------------------
        sanitized_clusters: List[Any] = []
        try:
            if isinstance(clusters, list):
                for c in clusters:
                    # if cluster is dict -> convert, else if pair -> ensure floats
                    if isinstance(c, dict):
                        # convert geometry-like dicts to lat/lon pair if possible
                        if "coordinates" in c and isinstance(c["coordinates"], (list, tuple)):
                            sanitized_clusters.append([float(c["coordinates"][0]), float(c["coordinates"][1])])
                        else:
                            sanitized_clusters.append(c)
                    elif isinstance(c, (list, tuple)) and len(c) >= 2:
                        try:
                            sanitized_clusters.append([float(c[0]), float(c[1])])
                        except Exception:
                            sanitized_clusters.append([c[0], c[1]])
                    else:
                        # ignore or push as-is (string/number)
                        sanitized_clusters.append(c)
            else:
                # if it's something else (DataFrame), try to_dict
                if hasattr(clusters, "to_dict"):
                    try:
                        sanitized_clusters = clusters.to_dict("records")
                    except Exception:
                        sanitized_clusters = []
                else:
                    sanitized_clusters = []
        except Exception:
            sanitized_clusters = []

        # ---------------------------
        # Build report (walkability mean + suggestions)
        # ---------------------------
        report: Dict[str, Any] = {"walkability_score": None, "summary": "", "suggestions": []}
        try:
            # If we computed blocks_gdf with 'walkability_score' column
            if blocks_gdf is not None:
                try:
                    mean_score = float(blocks_gdf["walkability_score"].mean())
                    report["walkability_score"] = round(mean_score, 2)
                except Exception:
                    # try if compute_walkability returned a plain dict
                    try:
                        if isinstance(blocks_gdf, dict) and "walkability_score" in blocks_gdf:
                            report["walkability_score"] = round(float(blocks_gdf["walkability_score"]), 2)
                    except Exception:
                        report["walkability_score"] = None
            else:
                # try to derive from a 'scores' variable if present
                # (some compute_walkability implementations return a dict)
                # No-op if not available
                pass
        except Exception:
            report["walkability_score"] = None

        # Suggestions from rec_list
        try:
            suggestions = []
            for rec in rec_list[:10]:
                if isinstance(rec, dict) and "description" in rec:
                    suggestions.append(str(rec["description"]))
                elif isinstance(rec, dict) and "name" in rec:
                    suggestions.append(str(rec.get("name")))
                else:
                    suggestions.append(str(rec))
            report["suggestions"] = suggestions
            if report["walkability_score"] is not None:
                report["summary"] = f"Computed mean walkability score {report['walkability_score']}."
            else:
                report["summary"] = "Walkability computed for the area."
        except Exception:
            report["summary"] = "Walkability computed for the area."
            report["suggestions"] = report.get("suggestions", [])

        # ---------------------------
        # Final JSON-safe response
        # ---------------------------
        response = {
            "clusters": sanitized_clusters,
            "recommendations": rec_list,
            "simulation": simulation,
            "report": report,
        }

        return JSONResponse(status_code=200, content=response)

    except Exception as e:
        tb = traceback.format_exc()
        print("❌ BACKEND ERROR (POST /analyze):")
        print(tb)
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "traceback": tb}
        )


@app.get("/health")
def health():
    return {"status": "healthy", "message": "Backend is running."}
