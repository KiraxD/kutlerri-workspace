-- Ensure team_members table allows all admin operations
-- Since we verify permissions at the application level, these can be fully permissive

DROP POLICY IF EXISTS "Users can read own team_members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team_members (admin bypass)" ON team_members;
DROP POLICY IF EXISTS "Users can update team_members (admin bypass)" ON team_members;
DROP POLICY IF EXISTS "Users can delete team_members (admin bypass)" ON team_members;
DROP POLICY IF EXISTS "team_mem_read" ON team_members;

-- Completely open policies for team_members (permissions checked at app level)
CREATE POLICY "Allow all reads" ON team_members FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON team_members FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON team_members FOR DELETE USING (true);
