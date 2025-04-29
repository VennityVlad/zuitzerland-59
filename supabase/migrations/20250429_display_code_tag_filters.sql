
-- Add tag_filters array column to display_codes
ALTER TABLE public.display_codes ADD COLUMN IF NOT EXISTS tag_filters UUID[];

-- Create index for faster array lookups
CREATE INDEX IF NOT EXISTS display_codes_tag_filters_idx ON public.display_codes USING GIN (tag_filters);
