#!/usr/bin/env node

/**
 * Storage Structure Migration Script for WebXRide 2.0
 * 
 * This script COPIES files to the new categorized folder structure
 * while KEEPING the originals intact for safe rollback.
 * 
 * Old structure: files/username/file.jpg
 * New structure: files/username/images/file.jpg
 * 
 * Usage:
 *   node scripts/migrate-storage-structure.js
 * 
 * Or with dry-run to see what will happen:
 *   node scripts/migrate-storage-structure.js --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// File type detection
const getFileCategory = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'images';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'videos';
  if (['glb', 'gltf', 'obj', 'fbx', 'usdz'].includes(ext)) return '3d';
  if (['html', 'htm'].includes(ext)) return 'public_html';
  
  return 'other';
};

// Parse command line args
const isDryRun = process.argv.includes('--dry-run');

const migrateStorageStructure = async () => {
  console.log('🚀 WebXRide 2.0 Storage Migration Script');
  console.log('========================================\n');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  } else {
    console.log('⚠️  LIVE MODE - Files will be copied to new structure\n');
  }

  try {
    // List all items in the files bucket
    console.log('📂 Scanning storage bucket...');
    const { data: allFolders, error: listError } = await supabase.storage
      .from('files')
      .list('', { limit: 1000 });

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    console.log(`Found ${allFolders.length} top-level folders/files\n`);

    const stats = {
      scanned: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      byCategory: {
        images: 0,
        audio: 0,
        videos: 0,
        '3d': 0,
        public_html: 0,
        other: 0
      }
    };

    // Process each user folder
    for (const folder of allFolders) {
      // Skip special folders and files
      if (!folder.name || 
          folder.name === 'common-assets' || 
          folder.name === 'user-html' ||
          folder.name === 'templates' ||
          folder.name.startsWith('.')) {
        console.log(`⏭️  Skipping: ${folder.name}`);
        continue;
      }

      console.log(`\n👤 Processing user folder: ${folder.name}`);

      // List files in this user's folder
      const { data: userFiles, error: userError } = await supabase.storage
        .from('files')
        .list(folder.name, { limit: 1000 });

      if (userError) {
        console.error(`  ❌ Error listing files for ${folder.name}:`, userError.message);
        stats.errors++;
        continue;
      }

      // Process each file
      for (const file of userFiles) {
        stats.scanned++;

        // Skip folders that already look like categories
        if (['images', 'audio', 'videos', '3d', 'other', 'public_html'].includes(file.name)) {
          console.log(`  ⏭️  Skipping category folder: ${file.name}`);
          stats.skipped++;
          continue;
        }

        // Skip non-file items
        if (!file.name.includes('.') || file.name.endsWith('/')) {
          stats.skipped++;
          continue;
        }

        const oldPath = `${folder.name}/${file.name}`;
        const category = getFileCategory(file.name);
        const newPath = `${folder.name}/${category}/${file.name}`;

        console.log(`  📄 ${file.name} → ${category}/`);

        if (!isDryRun) {
          try {
            // Download the file
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('files')
              .download(oldPath);

            if (downloadError) {
              throw downloadError;
            }

            // Upload to new location (don't overwrite if exists)
            const { error: uploadError } = await supabase.storage
              .from('files')
              .upload(newPath, fileData, {
                contentType: file.metadata?.mimetype || 'application/octet-stream',
                upsert: false // Don't overwrite existing files
              });

            if (uploadError) {
              if (uploadError.message.includes('already exists')) {
                console.log(`  ⚠️  File already exists in new location, skipping`);
                stats.skipped++;
              } else {
                throw uploadError;
              }
            } else {
              console.log(`  ✅ Copied successfully`);
              stats.migrated++;
              stats.byCategory[category]++;
            }
          } catch (error) {
            console.error(`  ❌ Error migrating ${file.name}:`, error.message);
            stats.errors++;
          }
        } else {
          // Dry run - just count what would be migrated
          stats.migrated++;
          stats.byCategory[category]++;
        }
      }
    }

    // Print summary
    console.log('\n\n========================================');
    console.log('📊 Migration Summary');
    console.log('========================================');
    console.log(`Files scanned:   ${stats.scanned}`);
    console.log(`Files migrated:  ${stats.migrated}${isDryRun ? ' (would be copied)' : ''}`);
    console.log(`Files skipped:   ${stats.skipped}`);
    console.log(`Errors:          ${stats.errors}`);
    console.log('\nBy Category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  ${category.padEnd(12)} ${count} files`);
      }
    });

    if (isDryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to actually migrate files.');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\n📝 Next steps:');
      console.log('1. Verify files in Supabase Storage dashboard');
      console.log('2. Test your WebXRide 2.0 deployment');
      console.log('3. Once confirmed working, you can delete old files if desired');
      console.log('\n⚠️  Old files are still in their original locations for rollback safety');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the migration
migrateStorageStructure();

