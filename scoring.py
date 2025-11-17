# utils/scoring.py
import geopandas as gpd
import numpy as np

def compute_walkability(blocks_gdf, edges_gdf, nodes_gdf=None, pois_gdf=None):
    print("⚖️ FINAL WALKABILITY COMPUTATION")
    print("=" * 60)

    if blocks_gdf is None or len(blocks_gdf) == 0:
        print("⚠️ No blocks found.")
        return blocks_gdf

    blocks_gdf = blocks_gdf.copy()
    blocks_gdf["walkability_score"] = 0.0

    # Project to meters
    try:
        edges_m = edges_gdf.to_crs(epsg=3857)
        blocks_m = blocks_gdf.to_crs(epsg=3857)
        nodes_m = nodes_gdf.to_crs(epsg=3857) if nodes_gdf is not None else None
        pois_m = pois_gdf.to_crs(epsg=3857) if pois_gdf is not None else None
    except Exception:
        edges_m, blocks_m, nodes_m, pois_m = edges_gdf, blocks_gdf, nodes_gdf, pois_gdf

    for i, block in blocks_m.iterrows():
        area = block.geometry.area if block.geometry.area > 0 else 1
        edges_in = edges_m[edges_m.intersects(block.geometry)]
        if len(edges_in) == 0:
            blocks_gdf.at[i, "walkability_score"] = 0
            continue

        # Street density (m/m²)
        total_len = edges_in.length.sum()
        density = total_len / area

        # Log-normalize density so small variations matter
        density_score = np.clip(np.log1p(density * 1000), 0, 6) / 6

        # Intersection density
        if nodes_m is not None and len(nodes_m) > 0:
            n_nodes = len(nodes_m[nodes_m.intersects(block.geometry)])
            intersection_density = np.log1p(n_nodes) / 5
        else:
            intersection_density = 0

        # Sidewalk coverage
        if "has_sidewalk" in edges_in.columns:
            coverage = edges_in["has_sidewalk"].astype(bool).mean()
        else:
            coverage = 0.1

        # POI density
        if pois_m is not None and len(pois_m) > 0:
            pois_in = pois_m[pois_m.intersects(block.geometry)]
            amenity_density = np.log1p(len(pois_in)) / 5
        else:
            amenity_density = 0

        # Combine
        score = (
            0.45 * density_score
            + 0.25 * intersection_density
            + 0.15 * coverage
            + 0.15 * amenity_density
        ) * 100

        blocks_gdf.at[i, "walkability_score"] = score

    # Normalize locally
    min_s, max_s = blocks_gdf["walkability_score"].min(), blocks_gdf["walkability_score"].max()
    if max_s > min_s:
        blocks_gdf["walkability_score_normalized"] = (
            (blocks_gdf["walkability_score"] - min_s)
            / (max_s - min_s)
            * 100
        )
    else:
        blocks_gdf["walkability_score_normalized"] = blocks_gdf["walkability_score"]

    print(blocks_gdf[["walkability_score", "walkability_score_normalized"]].describe())
    print("✅ Walkability scores computed\n")
    return blocks_gdf
