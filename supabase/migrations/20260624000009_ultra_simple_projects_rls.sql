-- Ultra-simple projects RLS - use direct subquery checks only
DROP POLICY IF EXISTS "proj_read" ON projects;

CREATE POLICY "proj_read" ON projects FOR SELECT 
  USING (
    -- Allow if user is a team member of this project's team
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proj_insert" ON projects;

CREATE POLICY "proj_insert" ON projects FOR INSERT 
  WITH CHECK (
    -- Allow if user is a team member
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proj_update" ON projects;

CREATE POLICY "proj_update" ON projects FOR UPDATE 
  USING (
    -- Allow if user is a team member
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
  );
