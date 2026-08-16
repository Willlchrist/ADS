/*
# Add professor column to subjects

## Changes
- Adds `professor` text column to `subjects` table (nullable)
- Allows storing the discipline's professor alongside lessons' professor
*/

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS professor text;
