
-- Function to get a display code by its code string
CREATE OR REPLACE FUNCTION public.get_display_code_by_code(code_param TEXT)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  location_filter UUID,
  tag_filter UUID,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    display_codes.id,
    display_codes.code,
    display_codes.name,
    display_codes.location_filter,
    display_codes.tag_filter,
    display_codes.created_at,
    display_codes.expires_at
  FROM 
    display_codes
  WHERE 
    display_codes.code = code_param;
END;
$$;

-- Function to get all display codes
CREATE OR REPLACE FUNCTION public.get_all_display_codes()
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  location_filter UUID,
  tag_filter UUID,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    display_codes.id,
    display_codes.code,
    display_codes.name,
    display_codes.location_filter,
    display_codes.tag_filter,
    display_codes.created_at,
    display_codes.expires_at
  FROM 
    display_codes
  ORDER BY 
    display_codes.created_at DESC;
END;
$$;

-- Function to create a display code
CREATE OR REPLACE FUNCTION public.create_display_code(
  code_param TEXT,
  name_param TEXT,
  location_filter_param UUID,
  tag_filter_param UUID,
  expires_at_param TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO display_codes (
    code,
    name,
    location_filter,
    tag_filter,
    expires_at
  ) VALUES (
    code_param,
    name_param,
    location_filter_param,
    tag_filter_param,
    expires_at_param
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to delete a display code
CREATE OR REPLACE FUNCTION public.delete_display_code(id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM display_codes WHERE id = id_param;
  RETURN FOUND;
END;
$$;
