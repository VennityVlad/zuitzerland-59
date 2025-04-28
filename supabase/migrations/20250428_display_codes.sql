
-- Create table for display access codes
CREATE TABLE IF NOT EXISTS display_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location_filter UUID REFERENCES locations(id),
  tag_filter UUID REFERENCES event_tags(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_code CHECK (length(code) >= 4)
);

-- Add RLS policies for display codes - only admins can manage codes
ALTER TABLE display_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to validate codes without login
CREATE POLICY "Allow public read access to display_codes" 
  ON display_codes FOR SELECT 
  USING (true);

-- Only admins can create, update, delete display codes
CREATE POLICY "Allow admins to create display codes" 
  ON display_codes FOR INSERT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.privy_id = auth.jwt() ->> 'sub' 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update display codes" 
  ON display_codes FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.privy_id = auth.jwt() ->> 'sub' 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete display codes" 
  ON display_codes FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.privy_id = auth.jwt() ->> 'sub' 
      AND profiles.role = 'admin'
    )
  );
