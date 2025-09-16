// Test script for development database setup
// Run with: node scripts/test-dev-setup.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('Please create .env.development with:');
  console.error('VITE_SUPABASE_URL=your_dev_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_dev_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSetup() {
  console.log('🧪 Testing Development Database Setup...\n');

  try {
    // Test 1: Check storage bucket
    console.log('1. Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage bucket error:', bucketError.message);
    } else {
      const filesBucket = buckets.find(b => b.name === 'files');
      if (filesBucket) {
        console.log('✅ Storage bucket "files" exists');
      } else {
        console.log('❌ Storage bucket "files" not found');
      }
    }

    // Test 2: Test file upload
    console.log('\n2. Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload('test-file.txt', testFile);

    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
    } else {
      console.log('✅ File upload successful');
      
      // Clean up test file
      await supabase.storage.from('files').remove(['test-file.txt']);
      console.log('✅ Test file cleaned up');
    }

    // Test 3: Test students table
    console.log('\n3. Testing students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5);

    if (studentsError) {
      console.error('❌ Students table error:', studentsError.message);
    } else {
      console.log('✅ Students table accessible');
      console.log(`   Found ${students.length} students:`, students.map(s => s.name));
    }

    // Test 4: Test adding a student
    console.log('\n4. Testing student creation...');
    const { data: newStudent, error: createError } = await supabase
      .from('students')
      .insert({ name: 'test-student-' + Date.now() })
      .select()
      .single();

    if (createError) {
      console.error('❌ Student creation error:', createError.message);
    } else {
      console.log('✅ Student creation successful:', newStudent.name);
      
      // Clean up test student
      await supabase.from('students').delete().eq('name', newStudent.name);
      console.log('✅ Test student cleaned up');
    }

    console.log('\n🎉 Development database setup test completed!');
    console.log('If you see any ❌ errors above, please run the setup script again.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSetup(); 