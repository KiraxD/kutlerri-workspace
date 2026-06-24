-- Fix team_members RLS policy to allow users to read their own team memberships
DROP POLICY IF EXISTS "team_mem_read" ON team_members;

CREATE POLICY "team_mem_read" ON team_members FOR SELECT 
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IS NOT NULL)
  );
