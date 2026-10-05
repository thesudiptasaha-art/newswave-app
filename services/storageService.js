import { supabase } from './supabase';

/**
 * Uploads a file to a specific Supabase bucket.
 * @param {string} bucket - The name of the bucket (e.g., 'avatars', 'documents').
 * @param {string} path - The path/name to save the file as.
 * @param {File} file - The actual file object.
 */
export async function uploadFile(bucket, path, file) {
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if same file name exists
    });

  if (error) {
    console.error('Upload Error:', error.message);
    throw error;
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

/**
 * Generates a unique file name using timestamp and original name
 */
export function generateFileName(originalName) {
  const ext = originalName.split('.').pop();
  const timestamp = new Date().getTime();
  return `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;
}
