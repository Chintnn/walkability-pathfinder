-- Enable PostGIS extension for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create areas table to store user-selected analysis areas
CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  geom geometry(Polygon, 4326) NOT NULL,
  bbox jsonb,
  area_km2 numeric,
  created_at timestamptz DEFAULT now(),
  created_by text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_areas_geom ON public.areas USING GIST(geom);

-- Create road_segments table for street network data
CREATE TABLE public.road_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  geom geometry(LineString, 4326) NOT NULL,
  highway text,
  lanes int,
  speed_limit int,
  sidewalk boolean DEFAULT false,
  surface text,
  length_m numeric,
  osm_id bigint,
  tags jsonb
);

CREATE INDEX idx_road_segments_geom ON public.road_segments USING GIST(geom);
CREATE INDEX idx_road_segments_area ON public.road_segments(area_id);

-- Create intersections table for street network nodes
CREATE TABLE public.intersections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  geom geometry(Point, 4326) NOT NULL,
  degree int,
  is_major boolean DEFAULT false,
  osm_id bigint,
  traffic_signal boolean DEFAULT false
);

CREATE INDEX idx_intersections_geom ON public.intersections USING GIST(geom);
CREATE INDEX idx_intersections_area ON public.intersections(area_id);

-- Create blocks table for urban blocks/parcels
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  geom geometry(Polygon, 4326) NOT NULL,
  area_m2 numeric,
  perimeter_m numeric,
  avg_sidewalk_coverage numeric,
  intersection_density numeric,
  amenity_distance numeric
);

CREATE INDEX idx_blocks_geom ON public.blocks USING GIST(geom);
CREATE INDEX idx_blocks_area ON public.blocks(area_id);

-- Create amenities table for POIs (shops, parks, schools, etc.)
CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  geom geometry(Point, 4326) NOT NULL,
  type text NOT NULL,
  name text,
  osm_id bigint,
  tags jsonb
);

CREATE INDEX idx_amenities_geom ON public.amenities USING GIST(geom);
CREATE INDEX idx_amenities_area ON public.amenities(area_id);
CREATE INDEX idx_amenities_type ON public.amenities(type);

-- Create clusters table for bottleneck detection results
CREATE TABLE public.clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  cluster_label int NOT NULL,
  method text NOT NULL,
  geom geometry(Polygon, 4326),
  metrics jsonb,
  walkability_score numeric,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_clusters_geom ON public.clusters USING GIST(geom);
CREATE INDEX idx_clusters_area ON public.clusters(area_id);

-- Create recommendations table for intervention suggestions
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  cluster_id uuid REFERENCES public.clusters(id) ON DELETE CASCADE,
  geom geometry NOT NULL,
  action_type text NOT NULL,
  rationale text,
  impact_estimate jsonb,
  cost_class text CHECK (cost_class IN ('low', 'medium', 'high')),
  priority int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recommendations_geom ON public.recommendations USING GIST(geom);
CREATE INDEX idx_recommendations_area ON public.recommendations(area_id);
CREATE INDEX idx_recommendations_cluster ON public.recommendations(cluster_id);

-- Create simulations table for scenario analysis
CREATE TABLE public.simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  actions jsonb NOT NULL,
  before_metrics jsonb,
  after_metrics jsonb,
  impact_summary jsonb,
  co2_reduction_kg numeric,
  walkability_improvement numeric,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_simulations_area ON public.simulations(area_id);

-- Create analysis_tasks table for tracking async processing
CREATE TABLE public.analysis_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress int DEFAULT 0,
  error_message text,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analysis_tasks_area ON public.analysis_tasks(area_id);
CREATE INDEX idx_analysis_tasks_status ON public.analysis_tasks(status);

-- Enable Row Level Security (basic policies for MVP)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intersections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read access for MVP (can be restricted later with auth)
CREATE POLICY "Allow public read on areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on areas" ON public.areas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on road_segments" ON public.road_segments FOR SELECT USING (true);
CREATE POLICY "Allow public read on intersections" ON public.intersections FOR SELECT USING (true);
CREATE POLICY "Allow public read on blocks" ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Allow public read on amenities" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Allow public read on clusters" ON public.clusters FOR SELECT USING (true);
CREATE POLICY "Allow public read on recommendations" ON public.recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public read on simulations" ON public.simulations FOR SELECT USING (true);
CREATE POLICY "Allow public read on analysis_tasks" ON public.analysis_tasks FOR SELECT USING (true);