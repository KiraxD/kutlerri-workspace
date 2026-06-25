-- Add acceptance_status column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS acceptance_status text DEFAULT 'accepted';
