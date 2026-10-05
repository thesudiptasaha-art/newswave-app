import { uploadFile as uploadToSupabase } from './storageService';

/**
 * Uploads a reference file to the currently configured storage provider.
 * This function abstracts the storage layer. 
 * 
 * FUTURE MIGRATION: 
 * If you switch from Supabase to Shared Local Storage, Google Drive, or a Personal Server,
 * you ONLY need to change the logic inside this function. The rest of the UI will remain completely untouched.
 */
export async function uploadReferenceFile(file) {
  // Current Provider: Supabase Storage
  // Future Providers: GoogleDriveAPI, LocalNetworkStorage, CustomServerAPI
  
  const provider = 'supabase'; // Change this string to switch providers in the future

  try {
    if (provider === 'supabase') {
      const fileName = `${new Date().getTime()}_${file.name.replace(/\s+/g, '_')}`;
      // Uploading to the 'documents' bucket
      const url = await uploadToSupabase('documents', fileName, file);
      return url;
    } 
    else if (provider === 'local') {
      // Logic for local network drive upload via your custom API (Django)
      // const url = await fetch('http://your-server/api/upload', { ... });
      // return url;
      throw new Error("Local storage provider not implemented yet.");
    }
  } catch (error) {
    console.error("Upload failed in provider:", error);
    throw error;
  }
}
