-- Fix projects RLS policy to allow team members to read projects
-- Previously required organization role, now allows team members to read projects

DROP POLICY IF EXISTS "proj_read" ON projects;

CREATE POLICY "proj_read" ON projects FOR SELECT 
  USING (
    -- Allow if user is a team member of the project's team
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
    OR
    -- OR allow if user has an org role
    EXISTS (SELECT 1 FROM teams WHERE teams.id = projects.team_id AND get_org_role(teams.organization_id) IS NOT NULL)
  );

-- Also fix proj_insert to allow team members without org roles
DROP POLICY IF EXISTS "proj_insert" ON projects;

CREATE POLICY "proj_insert" ON projects FOR INSERT 
  WITH CHECK (
    -- Allow if user is a team member AND has proper permission
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM teams WHERE teams.id = projects.team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );

-- Fix proj_update similarly
DROP POLICY IF EXISTS "proj_update" ON projects;

CREATE POLICY "proj_update" ON projects FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = projects.team_id AND team_members.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM teams WHERE teams.id = projects.team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );
