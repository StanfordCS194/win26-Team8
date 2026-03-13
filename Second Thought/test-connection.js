// Test Supabase connection
// Run with: node test-connection.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mohgivduzthccoybnbnr.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check if API key is set
if (!supabaseKey) {
  console.log('❌ ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY not found!');
  console.log('\n📝 To fix this:');
  console.log('   1. Create a .env file in the mindful folder');
  console.log('   2. Add: EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here');
  console.log('   3. Get your key from: https://mohgivduzthccoybnbnr.supabase.co/project/_/settings/api\n');
  process.exit(1);
}

console.log('✅ API Key found in .env file');
console.log(`   Key starts with: ${supabaseKey.substring(0, 20)}...`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by checking tables
async function testConnection() {
  try {
    console.log('🔄 Testing database connection...\n');

    // Test 1: Check profiles table
    console.log('1️⃣  Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log(`   ❌ Error: ${profilesError.message}`);
    } else {
      console.log('   ✅ profiles table accessible');
    }

    // Test 2: Check items table
    console.log('2️⃣  Testing items table...');
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('count')
      .limit(1);
    
    if (itemsError) {
      console.log(`   ❌ Error: ${itemsError.message}`);
    } else {
      console.log('   ✅ items table accessible');
    }

    // Test 3: Check item_reflections table
    console.log('3️⃣  Testing item_reflections table...');
    const { data: reflections, error: reflectionsError } = await supabase
      .from('item_reflections')
      .select('count')
      .limit(1);
    
    if (reflectionsError) {
      console.log(`   ❌ Error: ${reflectionsError.message}`);
    } else {
      console.log('   ✅ item_reflections table accessible');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!profilesError && !itemsError && !reflectionsError) {
      console.log('🎉 SUCCESS! Database connection working perfectly!\n');
      console.log('✅ Your API key is valid');
      console.log('✅ All tables are accessible');
      console.log('✅ Ready to start the app!\n');
      console.log('Next step: npm start\n');
    } else {
      console.log('⚠️  WARNING: Some tables had errors\n');
      console.log('Possible issues:');
      console.log('  - Tables might not exist yet');
      console.log('  - Row Level Security policies might be missing');
      console.log('  - API key might have wrong permissions\n');
      console.log('Solution: Run database/add_rls_policies.sql in Supabase SQL Editor\n');
    }

  } catch (error) {
    console.log('❌ CONNECTION FAILED\n');
    console.log(`Error: ${error.message}\n`);
    console.log('Possible causes:');
    console.log('  - Wrong API key');
    console.log('  - Network issues');
    console.log('  - Wrong project URL\n');
  }
}

testConnection();

