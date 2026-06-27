-- ============================================================
-- Migration: Fix Attendance RLS Policies
-- Exclude managers from seeing/deleting other users' logs
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "attendance_read" ON public.attendance_logs;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance_logs;

-- Recreate SELECT policy: only super_admin and admin can see others' logs, normal users (and managers) see their own
CREATE POLICY "attendance_read" ON public.attendance_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        get_org_role(organization_id) IN ('super_admin', 'admin')
    );

-- Recreate DELETE policy: only super_admin and admin can delete logs
CREATE POLICY "attendance_delete" ON public.attendance_logs
    FOR DELETE USING (
        get_org_role(organization_id) IN ('super_admin', 'admin')
    );
