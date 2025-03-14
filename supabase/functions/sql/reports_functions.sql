
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
