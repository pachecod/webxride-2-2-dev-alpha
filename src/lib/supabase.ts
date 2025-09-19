import { createClient } from '@supabase/supabase-js';
import type { DBProject } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseKey ? 'present' : 'missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Project functions
export const getUserProjects = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('No user found') };

    return await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

export const createProject = async (project: Partial<DBProject>) => {
  try {
    return await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (id: string, updates: Partial<DBProject>) => {
  try {
    return await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const getProject = async (id: string) => {
  try {
    return await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
};

// File functions
export const createFile = async (file: {
  project_id: string;
  name: string;
  type: string;
  content: string;
}) => {
  try {
    return await supabase
      .from('files')
      .insert(file)
      .select()
      .single();
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

export const updateFile = async (id: string, updates: {
  content?: string;
  type?: string;
}) => {
  try {
    return await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

export const getProjectFiles = async (projectId: string) => {
  try {
    return await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('name');
  } catch (error) {
    console.error('Error getting project files:', error);
    throw error;
  }
};

// Storage functions - improved error handling
export const getFiles = async (options?: { limit?: number; offset?: number; folder?: string; user?: string }) => {
  try {
    const limit = options?.limit;
    const offset = options?.offset || 0;
    const folderFilter = options?.folder;
    const userFilter = options?.user;
    console.log('=== getFiles called ===');
    console.log('Options:', { limit, offset, folderFilter, userFilter });
    
    const allFiles = [];
    let folders: string[];
    
    // Handle common-assets folder
    if (folderFilter === 'common-assets') {
      // List all category folders within common-assets
      const categories = ['images', 'audio', '3d', 'other'];
      folders = categories.map(cat => `common-assets/${cat}`);
      console.log('Common assets mode - checking folders:', folders);
    } else if (userFilter && userFilter !== 'admin') {
      // Only list files for the selected student
      folders = [`${userFilter}/${folderFilter}`];
      console.log('Student mode - checking folders:', folders);
    } else {
      // Admin: list all files in all user folders
      // First, get all user folders, then for each user, check the specific category folder
      console.log('Admin mode - listing all user folders first...');
      const { data: userFolders, error: userFoldersError } = await supabase.storage.from('files').list('', { limit: 1000 });
      if (userFoldersError) {
        console.warn('Error listing user folders:', userFoldersError);
        return { files: [], total: 0 };
      }
      console.log('Found user folders:', userFolders?.map(f => f.name));
      folders = (userFolders || [])
        .filter(f => f.name && !f.name.startsWith('.') && f.name !== 'templates' && f.name !== 'common-assets')
        .map(f => `${f.name}/${folderFilter}`);
      console.log('Admin mode - checking folders:', folders);
    }
    
    for (const folder of folders) {
      try {
        console.log(`\n--- Checking folder: ${folder} ---`);
        const { data: folderFiles, error: folderError } = await supabase.storage
          .from('files')
          .list(folder, { 
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });
        console.log(`Folder ${folder} result:`, { files: folderFiles, error: folderError });
        if (folderError) {
          console.warn(`Error accessing folder ${folder}:`, folderError);
          continue;
        }
        if (folderFiles && folderFiles.length > 0) {
          const actualFiles = folderFiles.filter((file: any) => 
            file.name && 
            file.name !== '.emptyFolderPlaceholder' &&
            file.name !== '.placeholder' &&
            !file.name.endsWith('/') &&
            file.name.includes('.') &&
            !file.name.endsWith('_preview.jpg') &&
            !file.name.endsWith('_thumb.jpg')
          );
          console.log(`Filtered files in ${folder}:`, actualFiles);
          for (const file of actualFiles) {
            try {
              const { data: { publicUrl } } = supabase.storage
                .from('files')
                .getPublicUrl(`${folder}/${file.name}`);
              const fileInfo = {
                name: file.name,
                originalName: getOriginalName(file.name),
                id: file.id || `${folder}-${file.name}-${Date.now()}`,
                type: folder.split('/')[1] || folder, // Extract category from path
                url: publicUrl,
                folder: folder,
                size: file.metadata?.size || 0,
                lastModified: file.updated_at || file.created_at || new Date().toISOString(),
                sourceUrl: file.metadata?.sourceUrl || null,
                sourceInfo: file.metadata?.sourceInfo || null,
                uploadedBy: file.metadata?.uploadedBy || null,
                uploadedAt: file.metadata?.uploadedAt || null
              };
              console.log(`Adding file:`, fileInfo);
              console.log(`File metadata:`, file.metadata);
              console.log(`Source URL from metadata:`, file.metadata?.sourceUrl);
              console.log(`Source Info from metadata:`, file.metadata?.sourceInfo);
              allFiles.push(fileInfo);
            } catch (urlError) {
              console.error(`Error getting URL for ${file.name}:`, urlError);
            }
          }
        } else {
          console.log(`No files found in ${folder}`);
        }
      } catch (error) {
        console.warn(`Error accessing folder ${folder}:`, error);
      }
    }
    // Sort all files (by name ascending)
    const sortedFiles = allFiles.sort((a, b) => a.name.localeCompare(b.name));
    const total = sortedFiles.length;
    // Apply pagination to the combined sorted array
    const pagedFiles =
      limit === undefined || limit === null
        ? sortedFiles
        : sortedFiles.slice(offset, offset + limit);
    console.log(`=== getFiles returning ${pagedFiles.length} files out of ${total} total ===`);
    return { files: pagedFiles, total };
  } catch (error) {
    console.error('Error in getFiles:', error);
    throw new Error(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'images';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (['glb', 'gltf', 'obj', 'fbx'].includes(ext)) return '3d';
  return 'other';
};

export const getOriginalName = (fileName: string): string => {
  // Remove timestamp and random ID suffixes
  const parts = fileName.split('.');
  if (parts.length < 2) return fileName;
  
  const nameWithoutExt = parts.slice(0, -1).join('.');
  const extension = parts[parts.length - 1];
  
  // Remove user ID prefix if present (UUID or similar, followed by dash)
  const nameNoUserPrefix = nameWithoutExt.replace(/^[a-z0-9\-]+-/, '');
  // Remove pattern like "-abc123-1234567890"
  const cleanName = nameNoUserPrefix.replace(/-[a-z0-9]+-\d+$/, '');
  
  return `${cleanName}.${extension}`;
};

export const getContentType = (extension: string): string => {
  const contentTypes: Record<string, string> = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  images: 10 * 1024 * 1024,    // 10MB for images
  audio: 50 * 1024 * 1024,     // 50MB for audio files
  '3d': 100 * 1024 * 1024,     // 100MB for 3D models
  other: 25 * 1024 * 1024      // 25MB for other files
} as const;

// Validate file size before upload
export const validateFileSize = (file: File, fileType: string): { valid: boolean; error?: string } => {
  const limit = FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.other;
  
  if (file.size > limit) {
    const maxSizeMB = Math.round(limit / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size for ${fileType} files is ${maxSizeMB}MB, but this file is ${fileSizeMB}MB.`
    };
  }
  
  return { valid: true };
};

// Utility functions for bucket setup and validation
export const validateSupabaseConnection = async () => {
  try {
    console.log('Validating Supabase connection...');
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('Auth error (this might be normal):', authError);
    }
    
    // Test storage access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      throw new Error(`Storage access failed: ${bucketsError.message}`);
    }
    
    console.log('Available buckets:', buckets?.map((b: any) => b.name));
    
    // Check if files bucket exists
    const filesBucket = buckets?.find((b: any) => b.name === 'files');
    if (!filesBucket) {
      console.warn('Files bucket not found. Available buckets:', buckets?.map((b: any) => b.name));
      return {
        success: false,
        message: 'Files bucket not found. Please create a bucket named "files" in your Supabase storage.',
        buckets: buckets?.map((b: any) => b.name) || []
      };
    }
    
    console.log('Files bucket found:', filesBucket);
    
    // Test listing files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('files')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.warn('Error listing files (this might be a permissions issue):', filesError);
      return {
        success: false,
        message: `Cannot list files: ${filesError.message}. Check your storage policies.`,
        buckets: buckets?.map((b: any) => b.name) || []
      };
    }
    
    return {
      success: true,
      message: 'Supabase connection validated successfully',
      buckets: buckets?.map((b: any) => b.name) || [],
      filesCount: files?.length || 0
    };
    
  } catch (error) {
    console.error('Supabase validation failed:', error);
    return {
      success: false,
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      buckets: []
    };
  }
};

// Debug function to test storage access step by step
export const debugStorageAccess = async () => {
  console.log('=== DEBUGGING STORAGE ACCESS ===');
  
  try {
    // Step 1: Test basic connection
    console.log('Step 1: Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth result:', { user: user ? 'Logged in' : 'Not logged in', error: authError });
    
    // Step 2: List buckets with more detail
    console.log('Step 2: Listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Full buckets response:', { data: buckets, error: bucketsError });
    console.log('Buckets result:', { buckets: buckets?.map((b: any) => b.name), error: bucketsError });
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError);
      console.log('This might be a permissions issue. Check your anon key permissions.');
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('⚠️ No buckets found. This could mean:');
      console.log('1. The bucket exists but you don\'t have permission to list buckets');
      console.log('2. The bucket is in a different state');
      console.log('3. There\'s an issue with your anon key');
    }
    
    // Step 3: Check for files bucket
    console.log('Step 3: Checking for files bucket...');
    const filesBucket = buckets?.find((b: any) => b.name === 'files');
    console.log('Files bucket found:', !!filesBucket);
    
    if (filesBucket) {
      console.log('Files bucket details:', filesBucket);
    }
    
    // Step 4: Try to access the files bucket directly even if not in list
    console.log('Step 4: Trying to access files bucket directly...');
    try {
      const { data: directFiles, error: directError } = await supabase.storage
        .from('files')
        .list('', { limit: 1 });
      console.log('Direct files bucket access:', { files: directFiles?.length || 0, error: directError });
      
      if (directError) {
        console.log('Direct access error details:', directError);
      }
    } catch (directAccessError) {
      console.log('Direct access exception:', directAccessError);
    }
    
    // Step 5: Test listing root files
    console.log('Step 5: Testing root file listing...');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('files')
      .list('', { limit: 10 });
    console.log('Root files result:', { files: rootFiles?.length || 0, error: rootError });
    
    if (rootError) {
      console.log('Root files error details:', rootError);
    }
    
    // Step 6: Test listing images folder
    console.log('Step 6: Testing images folder...');
    const { data: imageFiles, error: imageError } = await supabase.storage
      .from('files')
      .list('images', { limit: 10 });
    console.log('Images folder result:', { files: imageFiles?.length || 0, error: imageError });
    
    if (imageFiles && imageFiles.length > 0) {
      console.log('Image files found:', imageFiles.map((f: any) => f.name));
      
      // Step 7: Test getting public URL for first image
      if (imageFiles[0]) {
        console.log('Step 7: Testing public URL generation...');
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(`images/${imageFiles[0].name}`);
        console.log('Public URL for first image:', publicUrl);
      }
    }
    
    // Step 8: Test other folders
    const folders = ['audio', '3d', 'other'];
    for (const folder of folders) {
      console.log(`Step 8: Testing ${folder} folder...`);
      const { data: folderFiles, error: folderError } = await supabase.storage
        .from('files')
        .list(folder, { limit: 5 });
      console.log(`${folder} folder result:`, { files: folderFiles?.length || 0, error: folderError });
    }
    
    console.log('=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Debug error:', error);
  }
};

export const createRequiredFolders = async () => {
  const folders = ['images', 'audio', '3d', 'other'];
  const results = [];
  
  for (const folder of folders) {
    try {
      // Create a placeholder file to ensure the folder exists
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      const { error } = await supabase.storage
        .from('files')
        .upload(`${folder}/.placeholder`, placeholderContent, {
          upsert: true
        });
      
      if (error) {
        console.warn(`Could not create folder ${folder}:`, error);
        results.push({ folder, success: false, error: error.message });
      } else {
        console.log(`Folder ${folder} ready`);
        results.push({ folder, success: true });
      }
    } catch (error) {
      console.warn(`Error creating folder ${folder}:`, error);
      results.push({ 
        folder, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
};

// Template functions
export const deleteTemplate = async (id: string) => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { success: false, error };
  }
};

// Storage-based Template functions
export const deleteTemplateFromStorage = async (templateId: string) => {
  try {
    console.log(`=== DELETING TEMPLATE ${templateId} FROM STORAGE ===`);
    
    // List all files in the template folder
    const { data: files, error: listError } = await supabase.storage
      .from('templates')
      .list(templateId, { limit: 100, offset: 0 });
    
    if (listError) {
      console.error('Error listing template files:', listError);
      throw listError;
    }
    
    console.log(`Files found in template ${templateId}:`, files);
    
    if (!files || files.length === 0) {
      console.log('No files found in template folder, template may already be deleted');
      return { success: true };
    }
    
    // Filter out directory entries and only delete actual files
    const actualFiles = files.filter(file => 
      file.name && 
      file.name !== '' && 
      !file.name.endsWith('/') &&
      file.metadata?.mimetype !== 'application/x-directory'
    );
    
    console.log(`Found ${actualFiles.length} actual files to delete out of ${files.length} total items`);
    
    if (actualFiles.length === 0) {
      console.log('No actual files found to delete');
      return { success: true };
    }
    
    // Delete each actual file in the template folder
    const deletePromises = actualFiles.map(async (file) => {
      try {
        console.log(`Attempting to delete file: ${templateId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('templates')
          .remove([`${templateId}/${file.name}`]);
        
        if (deleteError) {
          console.error(`Error deleting ${file.name}:`, deleteError);
          return { success: false, file: file.name, error: deleteError };
        }
        
        console.log(`Successfully deleted file: ${templateId}/${file.name}`);
        return { success: true, file: file.name };
      } catch (e) {
        console.error(`Error deleting ${file.name}:`, e);
        return { success: false, file: file.name, error: e };
      }
    });
    
    const results = await Promise.all(deletePromises);
    const failedDeletes = results.filter(r => !r.success);
    
    if (failedDeletes.length > 0) {
      console.error('Some files failed to delete:', failedDeletes);
      throw new Error(`Failed to delete some files: ${failedDeletes.map(f => f.file).join(', ')}`);
    }
    
    // Update template order by removing the deleted template
    try {
      const { data: currentOrder } = await loadTemplateOrder();
      if (currentOrder && Array.isArray(currentOrder)) {
        const updatedOrder = currentOrder.filter(id => id !== templateId);
        await saveTemplateOrder(updatedOrder);
        console.log(`Updated template order, removed ${templateId}`);
      }
    } catch (orderError) {
      console.error('Error updating template order:', orderError);
      // Don't fail the deletion if order update fails
    }
    
    console.log(`Template ${templateId} deleted successfully`);
    return { success: true };
    
  } catch (error) {
    console.error(`Error deleting template ${templateId} from Storage:`, error);
    return { success: false, error };
  }
};

// Fallback function to get local templates when Supabase is not available
const getLocalTemplates = async () => {
  console.log('Loading local templates...');
  try {
    // Define local templates that are available in the public/templates directory
    const localTemplates = [
      {
        id: '360soundslides',
        name: '360 Sound Slides',
        framework: 'html',
        description: 'Interactive 360-degree sound slides template',
        files: []
      },
      {
        id: 'immersivemuseum',
        name: 'Immersive Museum',
        framework: 'html',
        description: 'Virtual museum experience template',
        files: []
      }
    ];
    
    console.log('Local templates loaded:', localTemplates);
    return { data: localTemplates, error: null };
  } catch (error) {
    console.error('Error loading local templates:', error);
    return { data: [], error };
  }
};

// Fallback function to load local template files
const loadLocalTemplate = async (templateId: string) => {
  console.log(`Loading local template ${templateId}...`);
  try {
    // Load template files from the public/templates directory
    const templateFiles = [];
    
    // Try to load index.html
    try {
      const response = await fetch(`/templates/${templateId}/index.html`);
      if (response.ok) {
        const content = await response.text();
        templateFiles.push({
          id: 'index.html',
          name: 'index.html',
          type: 'html',
          content
        });
      }
    } catch (e) {
      console.log(`Could not load index.html for ${templateId}`);
    }
    
    // Try to load style.css
    try {
      const response = await fetch(`/templates/${templateId}/style.css`);
      if (response.ok) {
        const content = await response.text();
        templateFiles.push({
          id: 'style.css',
          name: 'style.css',
          type: 'css',
          content
        });
      }
    } catch (e) {
      console.log(`Could not load style.css for ${templateId}`);
    }
    
    // Try to load script.js
    try {
      const response = await fetch(`/templates/${templateId}/script.js`);
      if (response.ok) {
        const content = await response.text();
        templateFiles.push({
          id: 'script.js',
          name: 'script.js',
          type: 'js',
          content
        });
      }
    } catch (e) {
      console.log(`Could not load script.js for ${templateId}`);
    }
    
    if (templateFiles.length === 0) {
      throw new Error(`No files found for local template ${templateId}`);
    }
    
    const templateName = templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const template = {
      id: templateId,
      name: templateName,
      framework: 'html',
      files: templateFiles
    };
    
    console.log(`Local template ${templateId} loaded:`, template);
    return { data: template, error: null };
    
  } catch (error) {
    console.error(`Error loading local template ${templateId}:`, error);
    return { data: null, error };
  }
};

export const getTemplatesFromStorage = async () => {
  console.log('DEBUG: getTemplatesFromStorage CALLED');
  try {
    console.log('Fetching templates from Storage...');
    // Debug log before calling list
    console.log('DEBUG: about to call supabase.storage.from("templates").list');
    // List all folders in the templates bucket
    const { data: templateFolders, error } = await supabase.storage
      .from('templates')
      .list('', { limit: 100, offset: 0 });
    // Debug log for raw list result
    console.log('DEBUG: supabase.storage.from(\'templates\').list result:', { templateFolders, error });
    
    if (error) {
      console.error('Error listing template folders:', error);
      // Fallback to local templates if Supabase fails
      console.log('Falling back to local templates...');
      return getLocalTemplates();
    }
    
    console.log('Template folders found:', templateFolders);
    
    // Filter out non-folder items and get template metadata
    const templates = await Promise.all(
      templateFolders
        .filter(item => item.metadata?.mimetype === 'application/x-directory' || item.name.includes('/'))
        .map(async (folder) => {
          const templateName = folder.name.replace('/', '');
          
          // Try to get template metadata from a metadata.json file
          try {
            const { data: metadataFile } = await supabase.storage
              .from('templates')
              .download(`${templateName}/metadata.json`);
            
            if (metadataFile) {
              const metadata = JSON.parse(await metadataFile.text());
              return {
                id: templateName,
                name: metadata.name || templateName,
                framework: metadata.framework || 'html',
                description: metadata.description || '',
                files: [] // Will be populated when template is loaded
              };
            }
          } catch (e) {
            console.log(`No metadata.json found for ${templateName}`);
          }
          
          // Fallback to folder name as template name
          return {
            id: templateName,
            name: templateName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            framework: 'html',
            description: '',
            files: []
          };
        })
    );
    
    console.log('Templates processed:', templates);
    return { data: templates, error: null };
    
  } catch (error) {
    console.error('Error getting templates from Storage:', error);
    // Fallback to local templates if Supabase fails
    console.log('Falling back to local templates...');
    return getLocalTemplates();
  }
};

export const loadTemplateFromStorage = async (templateId: string) => {
  try {
    console.log(`Loading template ${templateId} from Storage...`);
    
    // List all files in the template folder
    const { data: files, error } = await supabase.storage
      .from('templates')
      .list(templateId, { limit: 100, offset: 0 });
    
    if (error) {
      console.error('Error listing template files:', error);
      // Fallback to local template loading
      console.log('Falling back to local template loading...');
      return loadLocalTemplate(templateId);
    }
    
    console.log(`Files found in template ${templateId}:`, files);
    
    // Download and process each file
    const templateFiles = await Promise.all(
      files
        .filter(file => !file.name.startsWith('.')) // Skip hidden files
        .filter(file => file.name !== 'metadata.json') // Skip metadata.json file
        .map(async (file) => {
          try {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('templates')
              .download(`${templateId}/${file.name}`);
            
            if (downloadError) {
              console.error(`Error downloading ${file.name}:`, downloadError);
              return null;
            }
            
            const content = await fileData.text();
            
            // Determine file type based on extension
            const extension = file.name.split('.').pop()?.toLowerCase();
            let type = 'html';
            if (extension === 'css') type = 'css';
            else if (extension === 'js') type = 'js';
            else if (extension === 'html') type = 'html';
            
            return {
              id: file.name,
              name: file.name,
              type,
              content
            };
          } catch (e) {
            console.error(`Error processing file ${file.name}:`, e);
            return null;
          }
        })
    );
    
    // Filter out null values and ensure we have at least an index.html
    const validFiles = templateFiles.filter(f => f !== null);
    
    if (validFiles.length === 0) {
      throw new Error(`No valid files found in template ${templateId}`);
    }
    
    // Get template metadata
    let templateName = templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let framework = 'html';
    
    try {
      const { data: metadataFile } = await supabase.storage
        .from('templates')
        .download(`${templateId}/metadata.json`);
      
      if (metadataFile) {
        const metadata = JSON.parse(await metadataFile.text());
        templateName = metadata.name || templateName;
        framework = metadata.framework || 'html';
      }
    } catch (e) {
      console.log(`No metadata.json found for ${templateId}, using defaults`);
    }
    
    const template = {
      id: templateId,
      name: templateName,
      framework,
      files: validFiles
    };
    
    console.log(`Template ${templateId} loaded:`, template);
    return { data: template, error: null };
    
  } catch (error) {
    console.error(`Error loading template ${templateId} from Storage:`, error);
    // Fallback to local template loading
    console.log('Falling back to local template loading...');
    return loadLocalTemplate(templateId);
  }
};

// Check if a template exists by name
export const findTemplateByName = async (templateName: string) => {
  try {
    const { data: templates, error } = await getTemplatesFromStorage();
    
    if (error) {
      console.error('Error getting templates:', error);
      return null;
    }
    
    // Find template with exact name match
    const existingTemplate = templates?.find(template => 
      template.name.toLowerCase() === templateName.toLowerCase()
    );
    
    return existingTemplate || null;
  } catch (error) {
    console.error('Error finding template by name:', error);
    return null;
  }
};

// Save template to Storage
export const saveTemplateToStorage = async (template: {
  name: string;
  framework: string;
  description?: string;
  files: Array<{ name: string; content: string; type: string }>;
}) => {
  try {
    // Check if a template with this name already exists
    const existingTemplate = await findTemplateByName(template.name);
    let templateId: string;
    
    if (existingTemplate) {
      // Update existing template
      templateId = existingTemplate.id;
      console.log('Updating existing template:', { templateId, templateName: template.name });
    } else {
      // Create new template with unique ID
      templateId = template.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      console.log('Creating new template:', { templateId, templateName: template.name });
    }
    
    console.log('Saving template to Storage:', { templateId, template });

    // Create metadata file (omit creator_id and creator_email for anonymous)
    const metadata = {
      name: template.name,
      framework: template.framework,
      description: template.description || '',
      creator_id: 'anonymous',
      creator_email: '',
      created_at: existingTemplate ? undefined : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upload metadata.json with upsert to overwrite existing
    const { error: metadataError } = await supabase.storage
      .from('templates')
      .upload(`${templateId}/metadata.json`, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (metadataError) {
      console.error('Error uploading metadata:', metadataError);
      throw new Error(`Failed to save template metadata: ${metadataError.message}`);
    }

    // Upload each file in the template with upsert to overwrite existing
    for (const file of template.files) {
      const contentType = file.name.endsWith('.html') ? 'text/html' :
                         file.name.endsWith('.css') ? 'text/css' :
                         file.name.endsWith('.js') ? 'application/javascript' :
                         'text/plain';

      const { error: fileError } = await supabase.storage
        .from('templates')
        .upload(`${templateId}/${file.name}`, file.content, {
          contentType,
          upsert: true
        });

      if (fileError) {
        console.error(`Error uploading ${file.name}:`, fileError);
        throw new Error(`Failed to save file ${file.name}: ${fileError.message}`);
      }
    }

    console.log('Template saved successfully to Storage:', templateId);
    
    // Only add to template order if this is a new template
    if (!existingTemplate) {
      try {
        const { data: currentOrder } = await loadTemplateOrder();
        const newOrder = currentOrder ? [...currentOrder, templateId] : [templateId];
        await saveTemplateOrder(newOrder);
        console.log('Updated template order to include new template');
      } catch (orderError) {
        console.warn('Could not update template order:', orderError);
      }
    }
    
    return { data: { id: templateId, ...template }, error: null };

  } catch (error) {
    console.error('Error saving template to Storage:', error);
    return { data: null, error };
  }
};

export const saveUserHtmlByName = async (userName: string, files: Array<{name: string, content: string, type?: string}>, projectName: string) => {
  try {
    // Convert username to kebab-case
    const userNamePrefix = userName.toLowerCase().replace(/\s+/g, '-');
    // Extract timestamp from projectName if present, else add it
    let folderName = projectName;
    const timestampMatch = projectName.match(/-\d{4}:\d{4}(am|pm)$/);
    let timestamp = '';
    if (timestampMatch) {
      timestamp = timestampMatch[0];
      folderName = `${userNamePrefix}-${projectName}`;
    } else {
      // If not present, add current timestamp
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hours = now.getHours();
      const min = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      timestamp = `-${mm}${dd}:${String(displayHours).padStart(2, '0')}${min}${ampm}`;
      folderName = `${userNamePrefix}-${projectName}${timestamp}`;
    }
    console.log('Saving user HTML by name:', { userName, folderName, projectName });
    
    // Use the existing 'files' bucket instead of creating a new one
    const bucketName = 'files';
    const userFolderPath = `user-html/${folderName}`;
    
    console.log('Using bucket:', bucketName, 'with path:', userFolderPath);
    
    // Create updated metadata file with enhanced cache busting
    const currentTimestamp = Date.now();
    const metadata = {
      name: folderName.split('-').slice(0, -1).join('-') || 'Updated Project',
      userName: userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: currentTimestamp, // Add version number to force cache invalidation
      cache_bust: currentTimestamp, // Additional cache busting field
      files: files.map(file => ({
        name: file.name,
        type: file.type || getFileType(file.name)
      }))
    };

    console.log('Uploading metadata:', metadata);

    // Upload metadata
    const { error: metadataError } = await supabase.storage
      .from(bucketName)
      .upload(`${userFolderPath}/metadata.json`, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (metadataError) {
      console.error('Error uploading metadata:', metadataError);
      throw metadataError;
    }

    console.log('Successfully uploaded metadata');

    // Upload each file
    const uploadPromises = files.map(async (file) => {
      const fileType = file.type || getFileType(file.name);
      const contentType = getContentType(fileType);
      
      console.log(`Uploading file: ${file.name} (${contentType})`);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(`${userFolderPath}/${file.name}`, file.content, {
          contentType,
          upsert: true
        });

      if (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }
      
      console.log(`Successfully uploaded ${file.name}`);
    });

    await Promise.all(uploadPromises);
    console.log('Successfully saved user HTML by name');
    
    return { data: folderName, error: null };
  } catch (error) {
    console.error('Error saving user HTML by name:', error);
    return { data: null, error };
  }
};

export const listUserHtmlByName = async (userName: string) => {
  try {
    console.log('Listing user HTML by name:', { userName });
    
    // Use the existing 'files' bucket with user-html subfolder
    const bucketName = 'files';
    const userHtmlPath = 'user-html';
    
    // List all folders in the user-html subfolder
    const { data: allFolders, error } = await supabase.storage
      .from(bucketName)
      .list(userHtmlPath, { limit: 1000, offset: 0 });

    if (error) {
      console.error('Error listing user HTML files:', error);
      throw error;
    }

    if (!allFolders || allFolders.length === 0) {
      console.log('No folders found in user-html path');
      return [];
    }

    // Filter folders that belong to this user (start with the user's name)
    const userNamePrefix = userName.toLowerCase().replace(/\s+/g, '-');
    const userFolders = allFolders.filter(folder => 
      folder.name.startsWith(userNamePrefix + '-')
    );

    console.log('Found user folders:', userFolders);

    // Get metadata for each user folder
    const filesWithMetadata = await Promise.all(
      userFolders.map(async (folder) => {
        try {
          const { data: metadataFile } = await supabase.storage
            .from(bucketName)
            .download(`${userHtmlPath}/${folder.name}/metadata.json`);
          
          if (metadataFile) {
            const text = await metadataFile.text();
            const metadata = JSON.parse(text);
            return {
              name: folder.name,
              metadata: metadata
            };
          }
        } catch (err) {
          console.error('Error loading metadata for folder:', folder.name, err);
        }
        return null;
      })
    );

    const validFiles = filesWithMetadata.filter(Boolean);
    console.log('Valid files with metadata:', validFiles);
    return validFiles;
  } catch (error) {
    console.error('Error listing user HTML by name:', error);
    return [];
  }
};

export const loadUserHtmlByName = async (userName: string, folderName: string, cacheBust?: number) => {
  try {
    console.log('Loading user HTML by name:', { userName, folderName, cacheBust });
    const bucketName = 'files';
    const userHtmlPath = 'user-html';

    // Get metadata first with aggressive cache busting
    const timestamp = cacheBust || Date.now();
    console.log('Using cache bust timestamp:', timestamp);
    
    const { data: metadataFile, error: metadataError } = await supabase.storage
      .from(bucketName)
      .download(`${userHtmlPath}/${folderName}/metadata.json`);

    if (metadataError || !metadataFile) {
      console.error('Error loading metadata:', metadataError);
      throw new Error('Could not load project metadata');
    }

    const metadataText = await metadataFile.text();
    const metadata = JSON.parse(metadataText);

    console.log('Loaded metadata with timestamp:', metadata.updated_at || metadata.created_at, 'cacheBust:', timestamp);
    console.log('Metadata version:', metadata.version);

    // Add a small delay to ensure storage propagation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load each file with cache busting
    const files = await Promise.all(
      metadata.files.map(async (fileInfo: any) => {
        console.log(`Loading file: ${fileInfo.name} with cache bust: ${timestamp}`);
        
        const { data: fileContent, error } = await supabase.storage
          .from(bucketName)
          .download(`${userHtmlPath}/${folderName}/${fileInfo.name}`);

        if (error || !fileContent) {
          console.error(`Error loading file ${fileInfo.name}:`, error);
          throw new Error(`Could not load file ${fileInfo.name}`);
        }

        const content = await fileContent.text();
        console.log(`Successfully loaded ${fileInfo.name} with ${content.length} characters`);
        
        return {
          name: fileInfo.name,
          type: fileInfo.type,
          content: content
        };
      })
    );

    console.log('Successfully loaded user HTML by name:', files.map(f => ({ name: f.name, contentLength: f.content.length })));
    return files;
  } catch (error) {
    console.error('Error loading user HTML by name:', error);
    throw error;
  }
};

export const deleteUserHtmlByName = async (userName: string, folderName: string) => {
  try {
    console.log('Deleting user HTML by name:', { userName, folderName });
    const bucketName = 'files';
    const userHtmlPath = 'user-html';

    // List all files in the folder
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(`${userHtmlPath}/${folderName}`);

    if (listError) {
      console.error('Error listing files for deletion:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found to delete');
      return { success: true };
    }

    // Delete each file
    const filePaths = files.map(file => `${userHtmlPath}/${folderName}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      throw deleteError;
    }

    console.log('Files deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user HTML by name:', error);
    throw error;
  }
};

// Update existing saved work in the same folder
export const updateUserHtmlByName = async (userName: string, files: Array<{name: string, content: string, type?: string}>, folderName: string) => {
  try {
    console.log('Updating user HTML by name:', { userName, folderName });
    
    // Use the existing 'files' bucket
    const bucketName = 'files';
    const userHtmlPath = 'user-html';
    
    console.log('Using bucket:', bucketName, 'with path:', userHtmlPath);
    
    // First, delete all existing files in the folder to ensure clean update
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list(`${userHtmlPath}/${folderName}`);

    if (listError) {
      console.error('Error listing existing files for cleanup:', listError);
      throw listError;
    }

    if (existingFiles && existingFiles.length > 0) {
      console.log('Deleting existing files before update:', existingFiles.map(f => f.name));
      const filePaths = existingFiles.map(file => `${userHtmlPath}/${folderName}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting existing files:', deleteError);
        throw deleteError;
      }
      console.log('Successfully deleted existing files');
    }
    
    // Create updated metadata file with enhanced cache busting
    const currentTimestamp = Date.now();
    const metadata = {
      name: folderName.split('-').slice(0, -1).join('-') || 'Updated Project',
      userName: userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: currentTimestamp, // Add version number to force cache invalidation
      cache_bust: currentTimestamp, // Additional cache busting field
      files: files.map(file => ({
        name: file.name,
        type: file.type || getFileType(file.name)
      }))
    };

    console.log('Uploading updated metadata:', metadata);

    // Upload updated metadata
    const { error: metadataError } = await supabase.storage
      .from(bucketName)
      .upload(`${userHtmlPath}/${folderName}/metadata.json`, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (metadataError) {
      console.error('Error uploading updated metadata:', metadataError);
      throw metadataError;
    }

    console.log('Successfully uploaded updated metadata');

    // Upload each file (this will create new files since we deleted the old ones)
    const uploadPromises = files.map(async (file) => {
      const fileType = file.type || getFileType(file.name);
      const contentType = getContentType(fileType);
      
      console.log(`Uploading updated file: ${file.name} (${contentType})`);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(`${userHtmlPath}/${folderName}/${file.name}`, file.content, {
          contentType,
          upsert: true
        });

      if (error) {
        console.error(`Error uploading updated ${file.name}:`, error);
        throw error;
      }
      
      console.log(`Successfully uploaded updated ${file.name}`);
    });

    await Promise.all(uploadPromises);
    console.log('Successfully updated user HTML by name');
    
    return { data: folderName, error: null };
  } catch (error) {
    console.error('Error updating user HTML by name:', error);
    return { data: null, error };
  }
};

// Debug function to test Supabase connection and bucket access
export const debugUserHtmlAccess = async (userName: string) => {
  try {
    console.log('=== DEBUG: Testing Supabase access ===');
    
    // Test 1: List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets);
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    // Test 2: Check if user-html bucket exists
    const userHtmlBucket = buckets?.find(bucket => bucket.name === 'user-html');
    console.log('user-html bucket found:', userHtmlBucket);
    
    if (userHtmlBucket) {
      // Test 3: List all folders in user-html bucket
      const { data: allFolders, error: foldersError } = await supabase.storage
        .from('user-html')
        .list('', { limit: 1000, offset: 0 });
      
      console.log('All folders in user-html bucket:', allFolders);
      if (foldersError) {
        console.error('Error listing folders:', foldersError);
        return;
      }
      
      // Test 4: Filter folders for this user
      const userNamePrefix = userName.toLowerCase().replace(/\s+/g, '-');
      const userFolders = allFolders?.filter(folder => 
        folder.name.startsWith(userNamePrefix + '-')
      ) || [];
      
      console.log('User name prefix:', userNamePrefix);
      console.log('Folders for user:', userFolders);
      
      // Test 5: Try to get metadata for each user folder
      for (const folder of userFolders) {
        try {
          const { data: metadataFile, error: metadataError } = await supabase.storage
            .from('user-html')
            .download(`${folder.name}/metadata.json`);
          
          if (metadataError) {
            console.error(`Error downloading metadata for ${folder.name}:`, metadataError);
          } else if (metadataFile) {
            const text = await metadataFile.text();
            const metadata = JSON.parse(text);
            console.log(`Metadata for ${folder.name}:`, metadata);
          }
        } catch (err) {
          console.error(`Error processing metadata for ${folder.name}:`, err);
        }
      }
    }
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Debug function error:', error);
  }
};

// Student management functions
export const getStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
};

export const addStudent = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const removeStudent = async (name: string) => {
  try {
    // First, delete all content created by this student
    const userFolderName = name;
    console.log('Deleting content for student:', name, 'folder:', userFolderName);
    
    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('files')
      .list(`user-html/${userFolderName}`);
    
    if (listError) {
      console.error('Error listing user files:', listError);
    } else if (files && files.length > 0) {
      // Delete all files in the user's folder
      const filePaths = files.map(file => `user-html/${userFolderName}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('files')
        .remove(filePaths);
      
      if (deleteError) {
        console.error('Error deleting user files:', deleteError);
      } else {
        console.log('Successfully deleted user files:', filePaths);
      }
    }
    
    // Then remove the student from the database
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('name', name);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing student:', error);
    throw error;
  }
};

export const updateStudent = async (oldName: string, newName: string) => {
  try {
    // First, rename the user's folder in storage
    const oldFolderName = oldName;
    const newFolderName = newName;
    
    // List all files in the old folder
    const { data: files, error: listError } = await supabase.storage
      .from('files')
      .list(`user-html/${oldFolderName}`);
    
    if (!listError && files && files.length > 0) {
      // Copy files to new folder
      for (const file of files) {
        const oldPath = `user-html/${oldFolderName}/${file.name}`;
        const newPath = `user-html/${newFolderName}/${file.name}`;
        
        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('files')
          .download(oldPath);
        
        if (!downloadError && fileData) {
          // Upload to new location
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(newPath, fileData);
          
          if (uploadError) {
            console.error('Error uploading file to new location:', uploadError);
          }
        }
      }
      
      // Delete old folder
      const filePaths = files.map(file => `user-html/${oldFolderName}/${file.name}`);
      await supabase.storage
        .from('files')
        .remove(filePaths);
    }
    
    // Update the student name in the database
    const { data, error } = await supabase
      .from('students')
      .update({ name: newName })
      .eq('name', oldName)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Class management functions
export const getClasses = async () => {
  try {
    return await supabase
      .from('classes')
      .select('*')
      .order('name');
  } catch (error) {
    console.error('Error getting classes:', error);
    throw error;
  }
};

export const createClass = async (classData: { name: string; description?: string }) => {
  try {
    return await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

export const updateClass = async (id: string, updates: { name?: string; description?: string }) => {
  try {
    return await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

export const deleteClass = async (id: string) => {
  try {
    return await supabase
      .from('classes')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

export const getStudentsByClass = async (classId: string) => {
  try {
    return await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('name');
  } catch (error) {
    console.error('Error getting students by class:', error);
    throw error;
  }
};

export const getStudentsWithClasses = async () => {
  try {
    return await supabase
      .from('students_with_classes')
      .select('*')
      .order('class_name, name');
  } catch (error) {
    console.error('Error getting students with classes:', error);
    throw error;
  }
};

// Updated student functions to include class_id
export const addStudentToClass = async (name: string, classId: string) => {
  try {
    return await supabase
      .from('students')
      .insert({ name, class_id: classId })
      .select()
      .single();
  } catch (error) {
    console.error('Error adding student to class:', error);
    throw error;
  }
};

export const updateStudentClass = async (studentId: string, classId: string) => {
  try {
    return await supabase
      .from('students')
      .update({ class_id: classId })
      .eq('id', studentId)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating student class:', error);
    throw error;
  }
};

// Updated storage functions for class-based structure
export const saveUserHtmlToClass = async (
  className: string, 
  userName: string, 
  files: Array<{name: string, content: string, type?: string}>, 
  projectName: string
) => {
  try {
    console.log('=== saveUserHtmlToClass called ===');
    console.log('Class:', className);
    console.log('User:', userName);
    console.log('Project:', projectName);
    console.log('Files:', files.map(f => f.name));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `${projectName}_${timestamp}`;
    const basePath = `classes/${className}/students/${userName}/${folderName}`;

    const uploadPromises = files.map(async (file) => {
      const filePath = `${basePath}/${file.name}`;
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, new Blob([file.content], { type: 'text/plain' }));

      if (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw error;
      }

      return { name: file.name, path: filePath };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    console.log('Files uploaded successfully:', uploadedFiles);

    return { success: true, files: uploadedFiles, folderName };
  } catch (error) {
    console.error('Error in saveUserHtmlToClass:', error);
    throw error;
  }
};

export const listUserHtmlFromClass = async (className: string, userName: string) => {
  try {
    console.log('=== listUserHtmlFromClass called ===');
    console.log('Class:', className);
    console.log('User:', userName);

    const basePath = `classes/${className}/students/${userName}`;
    const { data, error } = await supabase.storage
      .from('files')
      .list(basePath);

    if (error) {
      console.error('Error listing user files:', error);
      throw error;
    }

    console.log('Found folders:', data);
    return data;
  } catch (error) {
    console.error('Error in listUserHtmlFromClass:', error);
    throw error;
  }
};

export const loadUserHtmlFromClass = async (className: string, userName: string, folderName: string) => {
  try {
    console.log('=== loadUserHtmlFromClass called ===');
    console.log('Class:', className);
    console.log('User:', userName);
    console.log('Folder:', folderName);

    const basePath = `classes/${className}/students/${userName}/${folderName}`;
    const { data, error } = await supabase.storage
      .from('files')
      .list(basePath);

    if (error) {
      console.error('Error listing folder contents:', error);
      throw error;
    }

    const filePromises = data.map(async (file) => {
      const filePath = `${basePath}/${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('files')
        .download(filePath);

      if (fileError) {
        console.error(`Error downloading ${file.name}:`, fileError);
        throw fileError;
      }

      const content = await fileData.text();
      return { name: file.name, content, type: getFileType(file.name) };
    });

    const files = await Promise.all(filePromises);
    console.log('Files loaded successfully:', files.map(f => f.name));

    return files;
  } catch (error) {
    console.error('Error in loadUserHtmlFromClass:', error);
    throw error;
  }
};

export const deleteUserHtmlFromClass = async (className: string, userName: string, folderName: string) => {
  try {
    console.log('=== deleteUserHtmlFromClass called ===');
    console.log('Class:', className);
    console.log('User:', userName);
    console.log('Folder:', folderName);

    const basePath = `classes/${className}/students/${userName}/${folderName}`;
    const { data, error } = await supabase.storage
      .from('files')
      .list(basePath);

    if (error) {
      console.error('Error listing folder contents for deletion:', error);
      throw error;
    }

    const filePaths = data.map(file => `${basePath}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('files')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      throw deleteError;
    }

    console.log('Files deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteUserHtmlFromClass:', error);
    throw error;
  }
};

// Save template order to Storage
export const saveTemplateOrder = async (templateIds: string[]) => {
  try {
    const { error } = await supabase.storage
      .from('templates')
      .upload('template-order.json', JSON.stringify(templateIds, null, 2), {
        contentType: 'application/json',
        upsert: true
      });
    
    if (error) {
      console.error('Error saving template order:', error);
      throw error;
    }
    
    console.log('Template order saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving template order:', error);
    return { success: false, error };
  }
};

// Load template order from Storage
export const loadTemplateOrder = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('templates')
      .download('template-order.json');
    
    if (error) {
      console.log('No saved template order found, using default order');
      return { data: null, error: null };
    }
    
    const text = await data.text();
    const order = JSON.parse(text);
    console.log('Loaded template order:', order);
    return { data: order, error: null };
  } catch (error) {
    console.error('Error loading template order:', error);
    return { data: null, error };
  }
};

// Get templates with custom order
export const getTemplatesWithOrder = async () => {
  try {
    // Get all templates from Storage
    const { data: storageTemplates, error: storageError } = await getTemplatesFromStorage();
    if (storageError) {
      console.error('Error getting Storage templates:', storageError);
      return { data: [], error: storageError };
    }
    
    if (!storageTemplates || storageTemplates.length === 0) {
      return { data: [], error: null };
    }
    
    // Get the saved order
    const { data: savedOrder } = await loadTemplateOrder();
    
    // Create a map of template IDs to templates
    const templateMap = new Map();
    storageTemplates.forEach(template => {
      templateMap.set(template.id, template);
    });
    
    // If we have a saved order, use it to sort templates
    if (savedOrder && Array.isArray(savedOrder)) {
      const orderedTemplates = [];
      const remainingTemplates = new Set(templateMap.keys());
      
      // Add templates in saved order
      for (const templateId of savedOrder) {
        if (templateMap.has(templateId)) {
          orderedTemplates.push(templateMap.get(templateId));
          remainingTemplates.delete(templateId);
        }
      }
      
      // Add any remaining templates at the end
      for (const templateId of remainingTemplates) {
        orderedTemplates.push(templateMap.get(templateId));
      }
      
      return { data: orderedTemplates, error: null };
    }
    
    // No saved order, return templates as-is
    return { data: storageTemplates, error: null };
  } catch (error) {
    console.error('Error getting templates with order:', error);
    return { data: [], error };
  }
};

// Default Template Functions
export const getDefaultTemplate = async () => {
  try {
    const { data, error } = await supabase
      .from('default_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default template set
        console.log('No default template found');
        return { data: null, error: null };
      }
      console.error('Error getting default template:', error);
      return { data: null, error };
    }

    console.log('Default template found:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error in getDefaultTemplate:', error);
    return { data: null, error };
  }
};

export const setDefaultTemplate = async (templateId: string, templateName: string, setByUser: string) => {
  try {
    // First, delete any existing default template
    const { error: deleteError } = await supabase
      .from('default_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error deleting existing default template:', deleteError);
      return { data: null, error: deleteError };
    }

    // Insert the new default template
    const { data, error } = await supabase
      .from('default_templates')
      .insert({
        template_id: templateId,
        template_name: templateName,
        set_by_user: setByUser
      })
      .select()
      .single();

    if (error) {
      console.error('Error setting default template:', error);
      return { data: null, error };
    }

    console.log('Default template set successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error in setDefaultTemplate:', error);
    return { data: null, error };
  }
};

export const removeDefaultTemplate = async () => {
  try {
    const { error } = await supabase
      .from('default_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('Error removing default template:', error);
      return { success: false, error };
    }

    console.log('Default template removed successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in removeDefaultTemplate:', error);
    return { success: false, error };
  }
};

// SNIPPETS HELPERS
export interface Snippet {
  id: string;
  title: string;
  code: string;
  created_at: string;
}

export async function getSnippets(): Promise<Snippet[]> {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Snippet[];
}

export async function addSnippet(title: string, code: string): Promise<Snippet> {
  const { data, error } = await supabase
    .from('snippets')
    .insert([{ title, code }])
    .select()
    .single();
  if (error) throw error;
  return data as Snippet;
}

export async function deleteSnippet(id: string): Promise<void> {
  const { error } = await supabase
    .from('snippets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ABOUT PAGE HELPERS
export interface AboutPage {
  id: string;
  title: string;
  content: string;
  css_content?: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getAboutPage(): Promise<AboutPage | null> {
  try {
    const { data, error } = await supabase
      .from('about_page')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, return null
        return null;
      }
      throw error;
    }

    return data as AboutPage;
  } catch (error) {
    console.error('Error getting about page:', error);
    return null;
  }
}

export async function updateAboutPage(title: string, content: string, cssContent: string, updatedBy: string): Promise<AboutPage> {
  try {
    // First, try to get existing about page
    const existingPage = await getAboutPage();
    
    if (existingPage) {
      // Update existing page
      const { data, error } = await supabase
        .from('about_page')
        .update({
          title,
          content,
          css_content: cssContent,
          updated_by: updatedBy
        })
        .eq('id', existingPage.id)
        .select()
        .single();

      if (error) throw error;
      return data as AboutPage;
    } else {
      // Create new page if none exists
      const { data, error } = await supabase
        .from('about_page')
        .insert([{
          title,
          content,
          css_content: cssContent,
          updated_by: updatedBy
        }])
        .select()
        .single();

      if (error) throw error;
      return data as AboutPage;
    }
  } catch (error) {
    console.error('Error updating about page:', error);
    throw error;
  }
}