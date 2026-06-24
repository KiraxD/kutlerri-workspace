-- Ultra-simple team_members RLS - just check direct membership
DROP POLICY IF EXISTS "team_mem_read" ON team_members;

CREATE POLICY "team_mem_read" ON team_members FOR SELECT 
  USING (auth.uid() = user_id);
