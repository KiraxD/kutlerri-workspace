-- Align live schema security and auth/profile sync with the current app
DROP VIEW IF EXISTS public.all_users_with_roles;

INSERT INTO public.profiles (id, email, full_name, phone_number, avatar_url)
SELECT
  users.id,
  COALESCE(users.email, ''),
  users.raw_user_meta_data->>'full_name',
  users.raw_user_meta_data->>'phone_number',
  users.raw_user_meta_data->>'avatar_url'
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
  updated_at = CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view relevant profiles." ON public.profiles;
CREATE POLICY "Users can view relevant profiles."
  ON public.profiles FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR EXISTS (
      SELECT 1
      FROM public.organization_members AS current_member
      JOIN public.organization_members AS target_member
        ON target_member.organization_id = current_member.organization_id
      WHERE current_member.user_id = (SELECT auth.uid())
        AND target_member.user_id = public.profiles.id
    )
  );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.log_team_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.teams WHERE id = COALESCE(NEW.team_id, OLD.team_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (organization_id, user_id, action_type, role_type, new_role, team_id, created_at)
    VALUES (v_org_id, NEW.user_id, 'team_role_assigned', 'team', NEW.role, NEW.team_id, CURRENT_TIMESTAMP);
  ELSIF TG_OP = 'UPDATE' AND NEW.role != OLD.role THEN
    INSERT INTO public.role_audit_log (organization_id, user_id, action_type, role_type, old_role, new_role, team_id, created_at)
    VALUES (v_org_id, NEW.user_id, 'team_role_changed', 'team', OLD.role, NEW.role, NEW.team_id, CURRENT_TIMESTAMP);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (organization_id, user_id, action_type, role_type, old_role, team_id, created_at)
    VALUES (v_org_id, OLD.user_id, 'team_role_removed', 'team', OLD.role, OLD.team_id, CURRENT_TIMESTAMP);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS team_members_role_audit ON public.team_members;
CREATE TRIGGER team_members_role_audit
AFTER INSERT OR UPDATE OR DELETE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.log_team_role_change();