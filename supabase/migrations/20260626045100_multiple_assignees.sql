-- Add assignee_ids array to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_ids uuid[] DEFAULT '{}';

-- Migrate existing assignee_id values to the assignee_ids array
UPDATE tasks 
SET assignee_ids = ARRAY[assignee_id] 
WHERE assignee_id IS NOT NULL 
  AND (assignee_ids IS NULL OR cardinality(assignee_ids) = 0);
