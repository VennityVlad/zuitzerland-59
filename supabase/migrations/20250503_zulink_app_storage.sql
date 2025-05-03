
-- Create storage bucket for app images
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true);

-- Set up access control policy for the bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'public');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'public'
        AND auth.role() = 'authenticated'
    );

-- Allow users to update and delete their own files
CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'public'
        AND auth.uid() = owner
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'public'
        AND auth.uid() = owner
    );
