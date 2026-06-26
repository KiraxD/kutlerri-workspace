-- Drop the outdated check constraint on notification types to allow modern types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
