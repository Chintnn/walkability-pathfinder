# utils/recommendations.py
import geopandas as gpd

def generate_recommendations(blocks_gdf, edges_gdf):
    """
    Generate adaptive recommendations based on relative walkability.
    Uses the mean score as a dynamic cutoff so recommendations differ
    across locations.
    """
    print("💡 GENERATING RECOMMENDATIONS")
    print("=" * 60)

    if blocks_gdf is None or len(blocks_gdf) == 0:
        print("⚠️ No blocks to analyze — skipping recommendations.")
        return gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs="EPSG:4326")

    # dynamic threshold: below mean is "low walkability"
    threshold = blocks_gdf["walkability_score_normalized"].mean()
    low_blocks = blocks_gdf[blocks_gdf["walkability_score_normalized"] < threshold]

    rec_points = []
    for _, blk in low_blocks.iterrows():
        centroid = blk.geometry.centroid if blk.geometry is not None else None
        rec_points.append({
            "action_type": "add_sidewalk",
            "description": "Below-average walkability. Add/upgrade sidewalks or crossings.",
            "priority": "HIGH" if blk["walkability_score_normalized"] < threshold / 2 else "MEDIUM",
            "impact_estimate": round(100 - blk["walkability_score_normalized"], 1),
            "cost_class": "MEDIUM",
            "geometry": centroid
        })

    if len(rec_points) == 0:
        print("✅ All blocks above-average — no major interventions needed.")
        return gpd.GeoDataFrame(columns=["geometry"], geometry="geometry", crs=blocks_gdf.crs)

    rec_gdf = gpd.GeoDataFrame(rec_points, crs=blocks_gdf.crs)
    print(f"✅ {len(rec_gdf)} recommendations created (cutoff={threshold:.1f})\n")
    return rec_gdf
