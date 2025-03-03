
-- Helper function to increment the reminder_count field in invoices table
CREATE OR REPLACE FUNCTION increment_reminder_count(invoice_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get the current count
  SELECT COALESCE(reminder_count, 0) INTO current_count FROM invoices WHERE id = invoice_id;
  
  -- Increment and return the new count
  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql;
