-- Step 1: Enums and Schema Changes

-- Organization roles
ALTER TYPE org_member_role RENAME TO org_member_role_old;
CREATE TYPE org_member_role AS ENUM ('super_admin', 'admin', 'manager', 'employee', 'viewer');

ALTER TABLE organization_members ALTER COLUMN role DROP DEFAULT;

ALTER TABLE organization_members 
  ALTER COLUMN role TYPE org_member_role 
  USING (
    CASE role::text
      WHEN 'owner' THEN 'super_admin'::org_member_role
      WHEN 'admin' THEN 'admin'::org_member_role
      WHEN 'member' THEN 'employee'::org_member_role
      WHEN 'guest' THEN 'viewer'::org_member_role
      ELSE 'employee'::org_member_role
    END
  );

ALTER TABLE organization_members ALTER COLUMN role SET DEFAULT 'employee'::org_member_role;
DROP TYPE org_member_role_old;

-- Team roles
CREATE TYPE team_member_role AS ENUM ('team_lead', 'senior_member', 'member', 'guest');

ALTER TABLE team_members 
  ADD COLUMN role team_member_role NOT NULL DEFAULT 'member';


-- Step 2: RLS Helper Functions
CREATE OR REPLACE FUNCTION get_org_role(org_id UUID)
RETURNS org_member_role AS $$
  SELECT role FROM organization_members 
  WHERE organization_id = org_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_team_role(t_id UUID)
RETURNS team_member_role AS $$
  SELECT role FROM team_members 
  WHERE team_id = t_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- Step 3: Clear existing policies
DO $$
DECLARE
    pol record;
    target_tables text[] := ARRAY['organizations', 'organization_members', 'teams', 'team_members', 'projects', 'issues', 'cycles', 'milestones', 'roadmap_items'];
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = ANY(target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;


-- Step 4: Add New RBAC Policies

--------------------------------------------------------------------------------
-- ORGANIZATIONS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "org_read" ON organizations FOR SELECT 
  USING (get_org_role(id) IS NOT NULL);

-- Create: Super Admin
CREATE POLICY "org_insert" ON organizations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Super Admin, Admin
CREATE POLICY "org_update" ON organizations FOR UPDATE 
  USING (get_org_role(id) IN ('super_admin', 'admin'));

-- Delete: Super Admin
CREATE POLICY "org_delete" ON organizations FOR DELETE 
  USING (get_org_role(id) = 'super_admin');


--------------------------------------------------------------------------------
-- ORGANIZATION_MEMBERS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "org_mem_read" ON organization_members FOR SELECT 
  USING (get_org_role(organization_id) IS NOT NULL);

-- Insert/Update/Delete (Manage Roles/Users): Super Admin, Admin
CREATE POLICY "org_mem_insert" ON organization_members FOR INSERT 
  WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin') OR auth.uid() = user_id);

CREATE POLICY "org_mem_update" ON organization_members FOR UPDATE 
  USING (get_org_role(organization_id) IN ('super_admin', 'admin'));

CREATE POLICY "org_mem_delete" ON organization_members FOR DELETE 
  USING (get_org_role(organization_id) IN ('super_admin', 'admin') OR auth.uid() = user_id);


--------------------------------------------------------------------------------
-- TEAMS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "team_read" ON teams FOR SELECT 
  USING (get_org_role(organization_id) IS NOT NULL);

-- CRUD: Super Admin, Admin, Manager
CREATE POLICY "team_insert" ON teams FOR INSERT 
  WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "team_update" ON teams FOR UPDATE 
  USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "team_delete" ON teams FOR DELETE 
  USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));


--------------------------------------------------------------------------------
-- TEAM_MEMBERS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer, or the user themselves
CREATE POLICY "team_mem_read" ON team_members FOR SELECT 
  USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IS NOT NULL)
  );

-- Manage Team Members: Super Admin, Admin, Manager
CREATE POLICY "team_mem_insert" ON team_members FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "team_mem_update" ON team_members FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "team_mem_delete" ON team_members FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager')) OR auth.uid() = user_id
  );


--------------------------------------------------------------------------------
-- PROJECTS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "proj_read" ON projects FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IS NOT NULL)
  );

-- Create + Update: Super Admin, Admin, Manager, Employee
CREATE POLICY "proj_insert" ON projects FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );

CREATE POLICY "proj_update" ON projects FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );

-- Delete: Super Admin, Admin, Manager
CREATE POLICY "proj_delete" ON projects FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager'))
  );


--------------------------------------------------------------------------------
-- ISSUES
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "issue_read" ON issues FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IS NOT NULL)
  );

-- Create: Super Admin, Admin, Manager, Employee
CREATE POLICY "issue_insert" ON issues FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee'))
  );

-- Update: Super Admin, Admin, Manager, Employee (Only own issues for employee)
CREATE POLICY "issue_update" ON issues FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager'))
    OR (
      EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) = 'employee')
      AND creator_id = auth.uid()
    )
  );

-- Delete: Super Admin, Admin, Manager, Employee (Only own issues for employee)
CREATE POLICY "issue_delete" ON issues FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager'))
    OR (
      EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) = 'employee')
      AND creator_id = auth.uid()
    )
  );


--------------------------------------------------------------------------------
-- CYCLES & MILESTONES & ROADMAP ITEMS
--------------------------------------------------------------------------------
-- Read: Super Admin, Admin, Manager, Employee, Viewer
CREATE POLICY "cycle_read" ON cycles FOR SELECT USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IS NOT NULL));
CREATE POLICY "cycle_insert" ON cycles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager')));
CREATE POLICY "cycle_update" ON cycles FOR UPDATE USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager')));
CREATE POLICY "cycle_delete" ON cycles FOR DELETE USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager')));

CREATE POLICY "ms_read" ON milestones FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
CREATE POLICY "ms_insert" ON milestones FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "ms_update" ON milestones FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "ms_delete" ON milestones FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));

CREATE POLICY "rm_read" ON roadmap_items FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
CREATE POLICY "rm_insert" ON roadmap_items FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "rm_update" ON roadmap_items FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "rm_delete" ON roadmap_items FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
