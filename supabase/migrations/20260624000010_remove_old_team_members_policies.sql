-- Remove all old team_members policies and create ultra-simple ones
DROP POLICY IF EXISTS "Org members can view team members." ON team_members;
DROP POLICY IF EXISTS "Org members can add to team." ON team_members;
DROP POLICY IF EXISTS "team_mem_read" ON team_members;

-- Ultra-simple team_members policies
CREATE POLICY "Users can read own team_members" ON team_members FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert team_members (admin bypass)" ON team_members FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update team_members (admin bypass)" ON team_members FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete team_members (admin bypass)" ON team_members FOR DELETE 
  USING (true);
