-- Step 1: Enums
CREATE TYPE task_status AS ENUM ('Backlog', 'Ready', 'Todo', 'In Progress', 'Review', 'Testing', 'Blocked', 'Done', 'Cancelled');
CREATE TYPE approval_status AS ENUM ('Draft', 'Pending Approval', 'Approved', 'Rejected');

-- Step 2: Rename Issues to Tasks
ALTER TABLE issues RENAME TO tasks;
ALTER TABLE issue_relations RENAME TO task_relations;
ALTER TABLE issue_labels RENAME TO task_labels;

ALTER TABLE task_relations RENAME COLUMN issue_id TO task_id;
ALTER TABLE task_relations RENAME COLUMN related_issue_id TO related_task_id;
ALTER TABLE task_labels RENAME COLUMN issue_id TO task_id;
ALTER TABLE comments RENAME COLUMN issue_id TO task_id;
ALTER TABLE activity_events RENAME COLUMN issue_id TO task_id;
ALTER TABLE notifications RENAME COLUMN issue_id TO task_id;

-- Migrate the task status Enum
ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tasks 
  ALTER COLUMN status TYPE task_status 
  USING (
    CASE status::text
      WHEN 'backlog' THEN 'Backlog'::task_status
      WHEN 'todo' THEN 'Todo'::task_status
      WHEN 'in_progress' THEN 'In Progress'::task_status
      WHEN 'in_review' THEN 'Review'::task_status
      WHEN 'done' THEN 'Done'::task_status
      WHEN 'canceled' THEN 'Cancelled'::task_status
      ELSE 'Todo'::task_status
    END
  );
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'Todo'::task_status;

-- Step 3: New Hierarchy Tables
CREATE TABLE initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'Backlog',
    target_date TIMESTAMPTZ,
    owner_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE epics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'Backlog',
    target_date TIMESTAMPTZ,
    owner_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN epic_id UUID REFERENCES epics(id) ON DELETE SET NULL;

CREATE TABLE sub_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status task_status DEFAULT 'Todo',
    assignee_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Vault Module
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vault_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES vault_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vault_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES vault_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT,
    approval_status approval_status DEFAULT 'Draft',
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vault_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    document_id UUID REFERENCES vault_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (vault_id IS NOT NULL AND document_id IS NULL) OR 
        (vault_id IS NULL AND document_id IS NOT NULL)
    )
);

CREATE TABLE vault_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vault_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Audit System
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 6: Enable RLS
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for New Tables

-- Initiatives & Epics (Org level)
CREATE POLICY "init_read" ON initiatives FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
CREATE POLICY "init_insert" ON initiatives FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "init_update" ON initiatives FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "init_delete" ON initiatives FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin'));

CREATE POLICY "epic_read" ON epics FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
CREATE POLICY "epic_insert" ON epics FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "epic_update" ON epics FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "epic_delete" ON epics FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin'));

-- Sub Tasks (Task/Team level)
CREATE POLICY "subtask_read" ON sub_tasks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM tasks 
        JOIN teams ON tasks.team_id = teams.id 
        WHERE tasks.id = sub_tasks.task_id AND get_org_role(teams.organization_id) IS NOT NULL
    )
);
CREATE POLICY "subtask_insert" ON sub_tasks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks 
        JOIN teams ON tasks.team_id = teams.id 
        WHERE tasks.id = sub_tasks.task_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee')
    )
);
CREATE POLICY "subtask_update" ON sub_tasks FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM tasks 
        JOIN teams ON tasks.team_id = teams.id 
        WHERE tasks.id = sub_tasks.task_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager', 'employee')
    )
);
CREATE POLICY "subtask_delete" ON sub_tasks FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM tasks 
        JOIN teams ON tasks.team_id = teams.id 
        WHERE tasks.id = sub_tasks.task_id AND get_org_role(teams.organization_id) IN ('super_admin', 'admin', 'manager')
    )
);

-- Vaults (Org level, fallback to read-only for employees if no specific permission)
CREATE POLICY "vault_read" ON vaults FOR SELECT USING (get_org_role(organization_id) IS NOT NULL);
CREATE POLICY "vault_insert" ON vaults FOR INSERT WITH CHECK (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "vault_update" ON vaults FOR UPDATE USING (get_org_role(organization_id) IN ('super_admin', 'admin', 'manager'));
CREATE POLICY "vault_delete" ON vaults FOR DELETE USING (get_org_role(organization_id) IN ('super_admin', 'admin'));

-- Vault Folders (Inherits Vault access)
CREATE POLICY "vfold_read" ON vault_folders FOR SELECT USING (
    EXISTS (SELECT 1 FROM vaults WHERE vaults.id = vault_id AND get_org_role(vaults.organization_id) IS NOT NULL)
);
CREATE POLICY "vfold_insert" ON vault_folders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM vaults WHERE vaults.id = vault_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin', 'manager'))
);
CREATE POLICY "vfold_update" ON vault_folders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM vaults WHERE vaults.id = vault_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin', 'manager'))
);
CREATE POLICY "vfold_delete" ON vault_folders FOR DELETE USING (
    EXISTS (SELECT 1 FROM vaults WHERE vaults.id = vault_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin', 'manager'))
);

-- Vault Documents
CREATE POLICY "vdoc_read" ON vault_documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM vault_folders 
        JOIN vaults ON vault_folders.vault_id = vaults.id 
        WHERE vault_folders.id = folder_id AND get_org_role(vaults.organization_id) IS NOT NULL
    )
);
CREATE POLICY "vdoc_insert" ON vault_documents FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM vault_folders 
        JOIN vaults ON vault_folders.vault_id = vaults.id 
        WHERE vault_folders.id = folder_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin', 'manager', 'employee')
    )
);
CREATE POLICY "vdoc_update" ON vault_documents FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM vault_folders 
        JOIN vaults ON vault_folders.vault_id = vaults.id 
        WHERE vault_folders.id = folder_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin', 'manager')
    ) OR author_id = auth.uid()
);
CREATE POLICY "vdoc_delete" ON vault_documents FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM vault_folders 
        JOIN vaults ON vault_folders.vault_id = vaults.id 
        WHERE vault_folders.id = folder_id AND get_org_role(vaults.organization_id) IN ('super_admin', 'admin')
    )
);

-- Audit Logs (Read-only for Super Admin, Insert for trigger functions but we'll allow insert for app tracking)
CREATE POLICY "audit_read" ON audit_logs FOR SELECT USING (get_org_role(organization_id) = 'super_admin');
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (get_org_role(organization_id) IS NOT NULL);

-- Replace the previous issue trigger function to handle the rename to tasks
DROP TRIGGER IF EXISTS trg_set_issue_identifier ON tasks;
DROP FUNCTION IF EXISTS set_issue_identifier();

CREATE OR REPLACE FUNCTION set_task_identifier()
RETURNS TRIGGER AS $$
DECLARE
    team_prefix TEXT;
    next_number INTEGER;
BEGIN
    SELECT identifier INTO team_prefix FROM teams WHERE id = NEW.team_id;
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_number FROM tasks WHERE team_id = NEW.team_id;
    
    NEW.number := next_number;
    NEW.identifier := team_prefix || '-' || next_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_task_identifier
BEFORE INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_task_identifier();
