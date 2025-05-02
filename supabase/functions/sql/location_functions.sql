
-- Function to get locations that a user can book based on their role
CREATE OR REPLACE FUNCTION public.get_bookable_locations_for_user(user_role text)
RETURNS TABLE (
  id uuid,
  name text,
  building text,
  floor text,
  type text,
  description text,
  max_occupancy int,
  created_at timestamptz,
  updated_at timestamptz,
  anyone_can_book boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.*
  FROM 
    locations l
  WHERE 
    l.type = 'Meeting Room' AND
    (
      -- Admins, co-curators, and co-designers can book any location
      user_role IN ('admin', 'co-curator', 'co-designer')
      OR
      -- Other roles can only book locations with anyone_can_book = true
      l.anyone_can_book = true
    )
  ORDER BY 
    l.name;
END;
$$;
