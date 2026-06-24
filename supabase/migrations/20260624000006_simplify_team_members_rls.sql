-- Simplify team_members RLS to be more permissive and reliable
DROP POLICY IF EXISTS "team_mem_read" ON team_members;

CREATE POLICY "team_mem_read" ON team_members FOR SELECT 
  USING (
    -- Allow if reading own membership
    auth.uid() = user_id
    OR
    -- OR allow if user has any role in the team's organization
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_members.organization_id = (
        SELECT organization_id FROM teams WHERE teams.id = team_members.team_id
      )
      AND organization_members.user_id = auth.uid()
    )
  );
