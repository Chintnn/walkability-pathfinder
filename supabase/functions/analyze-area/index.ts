import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AreaRequest {
  name: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, geometry }: AreaRequest = await req.json();

    console.log('Received analysis request for area:', name);

    // Validate geometry
    if (!geometry || geometry.type !== 'Polygon') {
      return new Response(
        JSON.stringify({ error: 'Invalid geometry. Must be a Polygon.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate bounding box and area
    const coords = geometry.coordinates[0];
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const bbox = {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };

    // Rough area calculation (km²)
    const latDiff = bbox.maxLat - bbox.minLat;
    const lngDiff = bbox.maxLng - bbox.minLng;
    const approxAreaKm2 = latDiff * lngDiff * 111 * 111 * Math.cos((bbox.minLat * Math.PI) / 180);

    // Validate area size (max 10 km²)
    if (approxAreaKm2 > 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Area too large. Maximum 10 km² allowed.',
          area_km2: approxAreaKm2.toFixed(2)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create GeoJSON string for PostGIS
    const geojson = JSON.stringify(geometry);

    // Insert area into database
    const { data: area, error: insertError } = await supabase
      .from('areas')
      .insert({
        name,
        geom: `SRID=4326;${geojson}`,
        bbox,
        area_km2: approxAreaKm2,
        status: 'processing',
        created_by: 'anonymous'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting area:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create area', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Area created:', area.id);

    // Create analysis task
    const { data: task, error: taskError } = await supabase
      .from('analysis_tasks')
      .insert({
        area_id: area.id,
        task_type: 'full_analysis',
        status: 'pending',
        progress: 0
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
    }

    // Trigger async processing (call process-osm function)
    const processUrl = `${supabaseUrl}/functions/v1/process-osm`;
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ 
        area_id: area.id,
        task_id: task?.id,
        bbox 
      })
    }).catch(err => console.error('Failed to trigger OSM processing:', err));

    return new Response(
      JSON.stringify({
        area_id: area.id,
        task_id: task?.id,
        status: 'processing',
        message: 'Analysis started. Use task_id to check progress.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-area:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});