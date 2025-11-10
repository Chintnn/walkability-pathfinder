import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { area_id, task_id, bbox }: { area_id: string; task_id: string; bbox: BBox } = await req.json();

    console.log('Processing OSM data for area:', area_id);

    // Update task progress
    await supabase
      .from('analysis_tasks')
      .update({ status: 'processing', progress: 10 })
      .eq('id', task_id);

    // Fetch OSM data using Overpass API
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["highway"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
        node["amenity"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
      );
      out body;
      >;
      out skel qt;
    `;

    console.log('Fetching OSM data...');
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const osmResponse = await fetch(overpassUrl, {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!osmResponse.ok) {
      throw new Error(`Overpass API error: ${osmResponse.statusText}`);
    }

    const osmData = await osmResponse.json();
    console.log(`Fetched ${osmData.elements?.length || 0} OSM elements`);

    // Update progress
    await supabase
      .from('analysis_tasks')
      .update({ progress: 30 })
      .eq('id', task_id);

    // Process nodes (intersections and amenities)
    const nodes = new Map<number, any>();
    const amenities: any[] = [];
    const intersections: any[] = [];

    for (const element of osmData.elements) {
      if (element.type === 'node') {
        nodes.set(element.id, element);
        
        if (element.tags?.amenity) {
          amenities.push({
            area_id,
            geom: `SRID=4326;POINT(${element.lon} ${element.lat})`,
            type: element.tags.amenity,
            name: element.tags.name || null,
            osm_id: element.id,
            tags: element.tags
          });
        }
      }
    }

    // Process ways (roads)
    const roadSegments = [];
    for (const element of osmData.elements) {
      if (element.type === 'way' && element.tags?.highway) {
        const nodeRefs = element.nodes || [];
        if (nodeRefs.length < 2) continue;

        const coords = nodeRefs
          .map((id: number) => nodes.get(id))
          .filter((n: any) => n && n.lat && n.lon)
          .map((n: any) => [n.lon, n.lat]);

        if (coords.length < 2) continue;

        const linestring = `SRID=4326;LINESTRING(${coords.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')})`;
        
        roadSegments.push({
          area_id,
          geom: linestring,
          highway: element.tags.highway,
          lanes: element.tags.lanes ? parseInt(element.tags.lanes) : null,
          speed_limit: element.tags.maxspeed ? parseInt(element.tags.maxspeed) : null,
          sidewalk: ['yes', 'both', 'left', 'right'].includes(element.tags.sidewalk || ''),
          surface: element.tags.surface || null,
          osm_id: element.id,
          tags: element.tags
        });

        // Mark first and last nodes as intersections
        const firstNode = nodes.get(nodeRefs[0]);
        const lastNode = nodes.get(nodeRefs[nodeRefs.length - 1]);
        
        for (const node of [firstNode, lastNode]) {
          if (node && !intersections.find(i => i.osm_id === node.id)) {
            intersections.push({
              area_id,
              geom: `SRID=4326;POINT(${node.lon} ${node.lat})`,
              degree: 2,
              is_major: ['primary', 'secondary', 'tertiary'].includes(element.tags.highway),
              osm_id: node.id,
              traffic_signal: node.tags?.highway === 'traffic_signals'
            });
          }
        }
      }
    }

    console.log(`Processed: ${roadSegments.length} roads, ${intersections.length} intersections, ${amenities.length} amenities`);

    // Insert into database
    if (roadSegments.length > 0) {
      const { error: roadError } = await supabase.from('road_segments').insert(roadSegments);
      if (roadError) console.error('Error inserting roads:', roadError);
    }

    if (intersections.length > 0) {
      const { error: intError } = await supabase.from('intersections').insert(intersections);
      if (intError) console.error('Error inserting intersections:', intError);
    }

    if (amenities.length > 0) {
      const { error: amenError } = await supabase.from('amenities').insert(amenities);
      if (amenError) console.error('Error inserting amenities:', amenError);
    }

    // Update progress and trigger clustering
    await supabase
      .from('analysis_tasks')
      .update({ progress: 60 })
      .eq('id', task_id);

    // Trigger clustering analysis
    const clusterUrl = `${supabaseUrl}/functions/v1/cluster-analysis`;
    fetch(clusterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ area_id, task_id })
    }).catch(err => console.error('Failed to trigger clustering:', err));

    return new Response(
      JSON.stringify({ success: true, message: 'OSM data processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-osm:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});