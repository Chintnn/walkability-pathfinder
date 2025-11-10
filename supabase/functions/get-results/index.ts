import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const areaId = url.searchParams.get('area_id');

    if (!areaId) {
      return new Response(
        JSON.stringify({ error: 'area_id parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch area details
    const { data: area } = await supabase
      .from('areas')
      .select('*')
      .eq('id', areaId)
      .single();

    // Fetch clusters
    const { data: clusters } = await supabase
      .from('clusters')
      .select('*')
      .eq('area_id', areaId)
      .order('walkability_score', { ascending: true });

    // Fetch recommendations
    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*, clusters(*)')
      .eq('area_id', areaId)
      .order('priority', { ascending: true });

    // Calculate summary metrics
    const avgWalkability = clusters && clusters.length > 0
      ? clusters.reduce((sum, c) => sum + (c.walkability_score || 0), 0) / clusters.length
      : 0;

    const criticalClusters = clusters?.filter(c => c.severity === 'critical').length || 0;

    return new Response(
      JSON.stringify({
        area,
        clusters: clusters || [],
        recommendations: recommendations || [],
        summary: {
          overall_walkability: avgWalkability,
          total_clusters: clusters?.length || 0,
          critical_areas: criticalClusters,
          total_recommendations: recommendations?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-results:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});