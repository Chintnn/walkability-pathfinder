# utils/visualization.py
import folium
import geopandas as gpd

def generate_walkability_map(blocks_gdf, edges_gdf, rec_gdf=None):
    """
    Build a folium map HTML representation from blocks (polygons), edges (lines) and rec_gdf (points).
    Returns an HTML string (m._repr_html_()).
    """
    print("🗺️ GENERATING INTERACTIVE MAP")
    print("=" * 60)

    # handle empties
    if edges_gdf is None or len(edges_gdf) == 0:
        # create a fallback map centered at 0,0
        m = folium.Map(location=[0, 0], zoom_start=2)
        return m._repr_html_()

    # ensure CRS and project to 4326 for folium
    try:
        edges_viz = edges_gdf.to_crs(epsg=4326)
    except Exception:
        edges_viz = edges_gdf.copy()

    try:
        blocks_viz = blocks_gdf.to_crs(epsg=4326) if (blocks_gdf is not None and len(blocks_gdf) > 0) else None
    except Exception:
        blocks_viz = blocks_gdf

    rec_viz = None
    if rec_gdf is not None and len(rec_gdf) > 0:
        try:
            rec_viz = rec_gdf.to_crs(epsg=4326)
        except Exception:
            rec_viz = rec_gdf

    # determine center from edges
    try:
        bounds = edges_viz.total_bounds  # minx, miny, maxx, maxy
        center = [(bounds[1] + bounds[3]) / 2, (bounds[0] + bounds[2]) / 2]
    except Exception:
        center = [0, 0]

    m = folium.Map(location=center, zoom_start=14)

    def get_color(score):
        try:
            if score < 30:
                return "#d73027"
            elif score < 60:
                return "#fee08b"
            else:
                return "#1a9850"
        except Exception:
            return "#999999"

    # draw blocks
    if blocks_viz is not None and len(blocks_viz) > 0:
        for _, block in blocks_viz.iterrows():
            score = block.get("walkability_score_normalized", 0)
            folium.GeoJson(
                block.geometry,
                style_function=lambda x, s=score: {
                    "fillColor": get_color(s),
                    "color": "black",
                    "weight": 1,
                    "fillOpacity": 0.5,
                },
                tooltip=f"Walkability: {score:.1f}/100",
            ).add_to(m)

    # draw edges (optional)
    try:
        folium.GeoJson(edges_viz.geometry.unary_union, name="edges").add_to(m)
    except Exception:
        pass

    # draw recommendations
    if rec_viz is not None and len(rec_viz) > 0:
        for _, rec in rec_viz.iterrows():
            geom = rec.geometry
            if geom is None:
                continue
            lat, lon = geom.y, geom.x
            popup_txt = f"{rec.get('action_type', '')} - {rec.get('description', '')}"
            folium.Marker(
                [lat, lon],
                popup=popup_txt,
                icon=folium.Icon(color="red", icon="info-sign"),
            ).add_to(m)

    return m._repr_html_()
