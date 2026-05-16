require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBatches() {
  const { data, error } = await supabase.from('batches').select('id, name, batch_code, is_active');
  console.log(data);
  const { data: students } = await supabase.from('students').select('id, full_name, student_id');
  console.log(students);
}

checkBatches();
