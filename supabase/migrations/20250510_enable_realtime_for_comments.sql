
-- Enable REPLICA IDENTITY FULL for the event_comments table
ALTER TABLE public.event_comments REPLICA IDENTITY FULL;

-- Add event_comments table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_comments;
