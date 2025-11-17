# utils/feature_extract.py
import geopandas as gpd
import networkx as nx
import shapely
import shapely.ops as ops
from shapely.geometry import MultiPolygon, Polygon
import traceback

def extract_features(nodes_gdf, edges_gdf, pois_gdf=None, G=None):
    """
    Convert network edges into multiple local walkability blocks
    by splitting the graph into subcomponents and buffering each separately.
    """
    try:
        if edges_gdf is None or len(edges_gdf) == 0:
            print("⚠️ No edges found — cannot extract features.")
            return gpd.GeoDataFrame(), edges_gdf, nodes_gdf

        print("🧩 Extracting multi-block features from edges...")

        # Fallback: build graph if not provided
        if G is None or len(G) == 0:
            import osmnx as ox
            G = ox.graph_from_gdfs(nodes_gdf, edges_gdf)

        # 1️⃣ Split graph into connected components
        subgraphs = [G.subgraph(c).copy() for c in nx.connected_components(G.to_undirected())]
        print(f"🔹 Found {len(subgraphs)} connected components")

        all_polygons = []
        for idx, subG in enumerate(subgraphs):
            sub_edges = [data["geometry"] for _, _, data in subG.edges(data=True) if "geometry" in data]
            if not sub_edges:
                continue

            # project to metric for proper buffering
            sub_gdf = gpd.GeoDataFrame(geometry=sub_edges, crs=edges_gdf.crs).to_crs(epsg=3857)

            # buffer only this component
            buffered = sub_gdf.buffer(6)
            merged = ops.unary_union(buffered)

            # break multipolygons into individual polygons
            if isinstance(merged, Polygon):
                polygons = [merged]
            elif isinstance(merged, MultiPolygon):
                polygons = list(merged.geoms)
            else:
                polygons = []

            for poly in polygons:
                if poly.area > 30:  # ignore tiny bits
                    all_polygons.append(poly)

        if not all_polygons:
            print("⚠️ No polygons generated, fallback to one combined block")
            return gpd.GeoDataFrame(geometry=[ops.unary_union(edges_gdf.to_crs(epsg=3857).buffer(5))],
                                    crs="EPSG:3857").to_crs(epsg=4326), edges_gdf, nodes_gdf

        blocks = gpd.GeoDataFrame(geometry=all_polygons, crs="EPSG:3857").to_crs(epsg=4326)
        print(f"✅ Extracted {len(blocks)} block polygons.")
        return blocks, edges_gdf, nodes_gdf

    except Exception as e:
        traceback.print_exc()
        print(f"❌ Feature extraction failed: {e}")
        return gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326"), edges_gdf, nodes_gdf
