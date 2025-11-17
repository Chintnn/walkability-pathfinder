# utils/data_fetch.py
import geopandas as gpd
import networkx as nx
import pandas as pd
import traceback
from shapely.geometry import Point

def fetch_osm_data(location_query: str, point: tuple = None, dist_m: int = 2000):
    """
    Fetch OSM walk network for a location or lat/lon point.
    Larger radius (2 km) helps capture meaningful variation across cities.
    Also fetches amenities/shops/leisure POIs for contextual scoring.
    """
    import osmnx as ox  # ensure import works at runtime

    try:
        print(f"\n🌍 Fetching OSM data for: {location_query}")

        # ----------------------------
        # 1️⃣ Fetch the OSM network
        # ----------------------------
        if point:
            lat, lon = point
            print(f"📍 Using point-based fetch around ({lat}, {lon}) ±{dist_m} m")
            G = ox.graph_from_point((lat, lon), dist=dist_m, network_type="walk", simplify=True)
        else:
            print("📍 Using place-name fetch via Nominatim")
            G = ox.graph_from_place(location_query, network_type="walk", simplify=True)

        nodes, edges = ox.graph_to_gdfs(G, nodes=True, edges=True)
        print(f"✅ OSM fetch successful — nodes={len(nodes)}, edges={len(edges)}")

        # ----------------------------
        # 2️⃣ Infer sidewalk presence
        # ----------------------------
        def infer_sidewalk(row):
            for key in ["sidewalk", "sidewalk:left", "sidewalk:right"]:
                if key in row and pd.notna(row[key]):
                    val = str(row[key]).lower()
                    return val in ("yes", "both", "left", "right", "1", "true")
            return False

        if "has_sidewalk" not in edges.columns:
            edges["has_sidewalk"] = edges.apply(infer_sidewalk, axis=1)

        # ----------------------------
        # 3️⃣ Fetch POIs (amenities, shops, leisure, transport)
        # ----------------------------
        tags = {
            "amenity": True,
            "shop": True,
            "leisure": True,
            "tourism": True,
            "public_transport": True,
        }

        try:
            if point:
                pois = ox.features_from_point((lat, lon), dist=dist_m, tags=tags)
            else:
                pois = ox.features_from_place(location_query, tags=tags)

            # Drop empty geometries
            pois = pois[~pois.geometry.is_empty]
            print(f"🏙️  POIs fetched: {len(pois)}")
        except Exception as e:
            print("⚠️  POI fetch failed:", e)
            pois = gpd.GeoDataFrame(columns=["geometry"], geometry="geometry")

        # ----------------------------
        # 4️⃣ Return everything
        # ----------------------------
        print(f"📦 Data summary: nodes={len(nodes)}, edges={len(edges)}, pois={len(pois)}\n")
        return G, nodes, edges, pois

    except Exception:
        print("❌ OSM fetch failed:")
        traceback.print_exc()

        empty_nodes = gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326")
        empty_edges = gpd.GeoDataFrame(columns=["geometry", "has_sidewalk"], geometry="geometry", crs="EPSG:4326")
        empty_pois = gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326")

        return nx.Graph(), empty_nodes, empty_edges, empty_pois
