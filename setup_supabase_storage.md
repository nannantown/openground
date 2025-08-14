# Supabase Storage Setup for Image Uploads

The chat feature requires a Supabase Storage bucket named "images" to upload and store message attachments.

**Current Status**: The chat functionality is working, but image uploads will fail until the storage bucket is created.

## Steps to Create the Storage Bucket:

### 1. **Access Supabase Dashboard**
- Go to https://supabase.com/dashboard
- Navigate to your project: `fszgxbcqtnybiuwatgyd`

### 2. **Go to Storage**
- Click on "Storage" in the left sidebar
- Click on "Create a new bucket"

### 3. **Create Images Bucket**
```
Bucket Name: images
Public Bucket: ✅ (checked)
File Size Limit: 50MB (recommended)
Allowed MIME Types: image/* (recommended)
```

### 4. **Set Storage Policies** (Run in SQL Editor)
```sql
-- Enable RLS on the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Policy to allow anyone to view images (since bucket is public)  
CREATE POLICY "Allow anyone to view images" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. **Test Upload**
After creating the bucket, try uploading an image in the chat interface. The error should be resolved.

## Alternative: Manual Bucket Creation via Dashboard
1. Storage → Create bucket → Name: "images" → Public: Yes → Create
2. The policies above will still need to be run in SQL Editor for proper permissions

## Quick Test
After setup, you can test image upload by:
1. Go to http://localhost:3001 
2. Navigate to any chat thread
3. Click "画像を添付" button
4. Try uploading an image

## Troubleshooting
If you still get "Bucket not found" errors:
- Verify bucket name is exactly "images" (lowercase)
- Ensure bucket is marked as public
- Check storage policies are applied correctly
- Refresh the application after creating the bucket
- Clear browser cache and reload the page

## Development Server
The application is currently running on http://localhost:3001 with full chat functionality except for image uploads.