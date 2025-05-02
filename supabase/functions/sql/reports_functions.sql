

-- Function to get invoice status distribution with an optional time filter
CREATE OR REPLACE FUNCTION public.get_invoice_status_distribution(time_filter text DEFAULT '')
RETURNS TABLE (
    status text,
    count bigint,
    revenue numeric
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY EXECUTE '
        SELECT 
            status, 
            COUNT(*) as count,
            SUM(price) as revenue
        FROM 
            invoices
        WHERE 
            1=1 ' || time_filter || '
        GROUP BY 
            status
        ORDER BY 
            count DESC
    ';
END;
$$;

-- Function to get monthly revenue data for a specific year
CREATE OR REPLACE FUNCTION public.get_monthly_revenue(year_filter integer)
RETURNS TABLE (
    month text,
    revenue numeric,
    invoice_count bigint,
    avg_value numeric
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            to_char(date_trunc('month', created_at), 'Month') as month_name,
            date_part('month', created_at) as month_num,
            SUM(price) as total_revenue,
            COUNT(*) as total_invoices
        FROM
            invoices
        WHERE
            date_part('year', created_at) = year_filter
        GROUP BY
            month_name, month_num
    )
    SELECT
        month_name as month,
        total_revenue as revenue,
        total_invoices as invoice_count,
        CASE WHEN total_invoices > 0 THEN total_revenue / total_invoices ELSE 0 END as avg_value
    FROM
        monthly_data
    ORDER BY
        month_num;
END;
$$;

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
