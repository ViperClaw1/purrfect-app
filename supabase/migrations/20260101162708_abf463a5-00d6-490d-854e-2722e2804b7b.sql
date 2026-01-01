-- Create storage bucket for cat images
INSERT INTO storage.buckets (id, name, public) VALUES ('cat-images', 'cat-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cat-images');

-- Allow public read access to images
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cat-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cat-images' AND auth.uid()::text = (storage.foldername(name))[1]);