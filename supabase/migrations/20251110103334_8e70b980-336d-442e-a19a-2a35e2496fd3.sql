-- Add write policies for all tables to complete RLS setup

-- Areas table write policies
CREATE POLICY "Allow public update on areas" ON public.areas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on areas" ON public.areas FOR DELETE USING (true);

-- Road segments write policies
CREATE POLICY "Allow public insert on road_segments" ON public.road_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on road_segments" ON public.road_segments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on road_segments" ON public.road_segments FOR DELETE USING (true);

-- Intersections write policies
CREATE POLICY "Allow public insert on intersections" ON public.intersections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on intersections" ON public.intersections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on intersections" ON public.intersections FOR DELETE USING (true);

-- Blocks write policies
CREATE POLICY "Allow public insert on blocks" ON public.blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on blocks" ON public.blocks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on blocks" ON public.blocks FOR DELETE USING (true);

-- Amenities write policies
CREATE POLICY "Allow public insert on amenities" ON public.amenities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on amenities" ON public.amenities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on amenities" ON public.amenities FOR DELETE USING (true);

-- Clusters write policies
CREATE POLICY "Allow public insert on clusters" ON public.clusters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clusters" ON public.clusters FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clusters" ON public.clusters FOR DELETE USING (true);

-- Recommendations write policies
CREATE POLICY "Allow public insert on recommendations" ON public.recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on recommendations" ON public.recommendations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on recommendations" ON public.recommendations FOR DELETE USING (true);

-- Simulations write policies
CREATE POLICY "Allow public insert on simulations" ON public.simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on simulations" ON public.simulations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on simulations" ON public.simulations FOR DELETE USING (true);

-- Analysis tasks write policies
CREATE POLICY "Allow public insert on analysis_tasks" ON public.analysis_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on analysis_tasks" ON public.analysis_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on analysis_tasks" ON public.analysis_tasks FOR DELETE USING (true);