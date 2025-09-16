// Script to seed built-in templates into Supabase
import { createClient } from '@supabase/supabase-js';
import { defaultTemplates } from '../src/templates';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTemplates() {
  const templates = Object.values(defaultTemplates);
  for (const template of templates) {
    const { name, framework, files } = template;
    // Check if template already exists (by name)
    const { data: existing, error: fetchError } = await supabase
      .from('templates')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (fetchError) {
      console.error(`Error checking for existing template '${name}':`, fetchError.message);
      continue;
    }
    if (existing) {
      console.log(`Template '${name}' already exists, skipping.`);
      continue;
    }
    const { error } = await supabase.from('templates').insert([
      {
        name,
        framework,
        files,
        creator_id: 'builtin',
        creator_email: 'admin@webxride.local',
      },
    ]);
    if (error) {
      console.error(`Error inserting template '${name}':`, error.message);
    } else {
      console.log(`Inserted template '${name}'.`);
    }
  }
  console.log('Seeding complete.');
}

seedTemplates().then(() => process.exit(0)); 