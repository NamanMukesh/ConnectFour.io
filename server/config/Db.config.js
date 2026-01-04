import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not found');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function testConnection() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not configured');
    return false;
  }

  try {
    const { error } = await supabase
      .from('games')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.error('Database tables not found.');
        console.error('Please run the SQL schema from server/database/supabase-schema.sql');
        console.error('in your Supabase SQL Editor (Dashboard > SQL Editor)');
      } else {
        console.error('Supabase connection error:', error.message);
      }
      return false;
    }

    console.log('Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err.message);
    return false;
  }
}


