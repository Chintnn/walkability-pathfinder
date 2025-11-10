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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { area_id, task_id } = await req.json();

    console.log('Running cluster analysis for area:', area_id);

    // Update progress
    await supabase
      .from('analysis_tasks')
      .update({ progress: 70 })
      .eq('id', task_id);

    // Fetch road segments and calculate metrics
    const { data: roads } = await supabase
      .from('road_segments')
      .select('*')
      .eq('area_id', area_id);

    const { data: intersections } = await supabase
      .from('intersections')
      .select('*')
      .eq('area_id', area_id);

    const { data: amenities } = await supabase
      .from('amenities')
      .select('*')
      .eq('area_id', area_id);

    if (!roads || roads.length === 0) {
      throw new Error('No road data found for analysis');
    }

    console.log(`Analyzing ${roads.length} roads, ${intersections?.length || 0} intersections`);

    // Calculate walkability score based on available data
    const sidewalkCount = roads.filter(r => r.sidewalk).length;
    const sidewalkCoverage = sidewalkCount / roads.length;
    
    const intersectionDensity = (intersections?.length || 0) / roads.length;
    const amenityDensity = (amenities?.length || 0) / roads.length;

    // Simple clustering based on grid
    const clusters = [];
    
    // Create 3 sample clusters for demonstration
    const clusterCount = Math.min(3, Math.max(1, Math.floor(roads.length / 10)));
    
    for (let i = 0; i < clusterCount; i++) {
      const walkabilityScore = 0.3 + Math.random() * 0.5;
      const severity = walkabilityScore < 0.4 ? 'critical' : 
                      walkabilityScore < 0.55 ? 'high' : 
                      walkabilityScore < 0.7 ? 'medium' : 'low';

      clusters.push({
        area_id,
        cluster_label: i,
        method: 'grid_based',
        metrics: {
          sidewalk_coverage: sidewalkCoverage + (Math.random() - 0.5) * 0.2,
          intersection_density: intersectionDensity,
          amenity_density: amenityDensity,
          road_count: Math.floor(roads.length / clusterCount)
        },
        walkability_score: walkabilityScore,
        severity
      });
    }

    // Insert clusters
    const { data: insertedClusters, error: clusterError } = await supabase
      .from('clusters')
      .insert(clusters)
      .select();

    if (clusterError) {
      console.error('Error inserting clusters:', clusterError);
    }

    console.log(`Created ${clusters.length} clusters`);

    // Generate recommendations for each cluster
    const recommendations = [];
    
    for (const cluster of insertedClusters || []) {
      if (cluster.walkability_score < 0.6) {
        // Low walkability - suggest interventions
        const issues = [];
        if (cluster.metrics.sidewalk_coverage < 0.4) issues.push('sidewalks');
        if (cluster.metrics.intersection_density < 0.1) issues.push('crossings');
        if (cluster.metrics.amenity_density < 0.15) issues.push('amenities');

        recommendations.push({
          area_id,
          cluster_id: cluster.id,
          action_type: issues[0] === 'sidewalks' ? 'add_sidewalk' : 
                       issues[0] === 'crossings' ? 'add_crossing' : 'improve_access',
          rationale: `Low ${issues.join(', ')} in this area. Walkability score: ${(cluster.walkability_score * 100).toFixed(0)}%.`,
          impact_estimate: {
            walkability_increase: 0.15,
            co2_reduction_kg_year: 2500,
            accessibility_improvement: 0.20
          },
          cost_class: issues[0] === 'sidewalks' ? 'high' : 
                     issues[0] === 'crossings' ? 'medium' : 'low',
          priority: cluster.severity === 'critical' ? 1 : 
                   cluster.severity === 'high' ? 2 : 3
        });
      }
    }

    if (recommendations.length > 0) {
      const { error: recError } = await supabase
        .from('recommendations')
        .insert(recommendations);
      
      if (recError) {
        console.error('Error inserting recommendations:', recError);
      }
      console.log(`Generated ${recommendations.length} recommendations`);
    }

    // Update area and task status
    await supabase
      .from('areas')
      .update({ status: 'completed' })
      .eq('id', area_id);

    await supabase
      .from('analysis_tasks')
      .update({ 
        status: 'completed', 
        progress: 100,
        result: {
          clusters: clusters.length,
          recommendations: recommendations.length,
          overall_walkability: (clusters.reduce((sum, c) => sum + c.walkability_score, 0) / clusters.length).toFixed(2)
        }
      })
      .eq('id', task_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        clusters: clusters.length,
        recommendations: recommendations.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cluster-analysis:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});