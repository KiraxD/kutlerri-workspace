-- Add role audit/history table for tracking all role changes
CREATE TABLE IF NOT EXISTS role_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('role_assigned', 'role_changed', 'role_removed', 'team_role_assigned', 'team_role_changed', 'team_role_removed')),
  role_type TEXT NOT NULL CHECK (role_type IN ('org', 'team')),
  old_role TEXT,
  new_role TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  changed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_by_role TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX idx_role_audit_org ON role_audit_log(organization_id);
CREATE INDEX idx_role_audit_user ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_created ON role_audit_log(created_at DESC);
CREATE INDEX idx_role_audit_team ON role_audit_log(team_id);

-- Enable RLS
ALTER TABLE role_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_audit_log
-- Users can view audit logs for their organization
CREATE POLICY "Users can view role audit logs for their org"
  ON role_audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Only admins can create audit logs (automatically via trigger)
CREATE POLICY "Only system can insert audit logs"
  ON role_audit_log FOR INSERT
  WITH CHECK (false);

-- Create trigger function to automatically log role changes in organization_members
CREATE OR REPLACE FUNCTION log_org_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      new_role,
      created_at
    ) VALUES (
      NEW.organization_id,
      NEW.user_id,
      'role_assigned',
      'org',
      NEW.role,
      CURRENT_TIMESTAMP
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      old_role,
      new_role,
      created_at
    ) VALUES (
      NEW.organization_id,
      NEW.user_id,
      'role_changed',
      'org',
      OLD.role,
      NEW.role,
      CURRENT_TIMESTAMP
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      old_role,
      created_at
    ) VALUES (
      OLD.organization_id,
      OLD.user_id,
      'role_removed',
      'org',
      OLD.role,
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for organization_members
CREATE TRIGGER organization_members_role_audit
AFTER INSERT OR UPDATE OR DELETE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION log_org_role_change();

-- Create trigger function for team_members role changes
CREATE OR REPLACE FUNCTION log_team_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get organization ID from team
  SELECT organization_id INTO v_org_id FROM teams WHERE id = NEW.team_id;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      new_role,
      team_id,
      created_at
    ) VALUES (
      v_org_id,
      NEW.user_id,
      'team_role_assigned',
      'team',
      NEW.team_role,
      NEW.team_id,
      CURRENT_TIMESTAMP
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.team_role != OLD.team_role THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      old_role,
      new_role,
      team_id,
      created_at
    ) VALUES (
      v_org_id,
      NEW.user_id,
      'team_role_changed',
      'team',
      OLD.team_role,
      NEW.team_role,
      NEW.team_id,
      CURRENT_TIMESTAMP
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO role_audit_log (
      organization_id,
      user_id,
      action_type,
      role_type,
      old_role,
      team_id,
      created_at
    ) VALUES (
      v_org_id,
      OLD.user_id,
      'team_role_removed',
      'team',
      OLD.team_role,
      OLD.team_id,
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for team_members
CREATE TRIGGER team_members_role_audit
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION log_team_role_change();
