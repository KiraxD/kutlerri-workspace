-- Fix projects INSERT/UPDATE RLS policies - use OR instead of AND
-- Users should be able to insert if they are a team member OR have an org role

DROP POLICY IF EXISTS "proj_insert" ON projects;

CREATE POLICY "proj_insert" ON projects FOR INSERT 
  WITH CHECK (
    -- Allow if user is a team member OR has proper org role
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM teams WHERE teams.id = projects.team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );

DROP POLICY IF EXISTS "proj_update" ON projects;

CREATE POLICY "proj_update" ON projects FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM teams WHERE teams.id = projects.team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );
