import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://ukkguaddknlsmxryhphb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVra2d1YWRka25sc214cnlocGhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NjgzMiwiZXhwIjoyMDg4NjUyODMyfQ.Wz5RDvkMLehhXsIyRH8dRXKa8mibSLymSFAQtqcjI2k',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = readFileSync('supabase/migrations/001_create_comments.sql', 'utf-8');

async function run() {
  // supabase-js non ha SQL diretto, usiamo fetch con pg-meta
  const res = await fetch('https://ukkguaddknlsmxryhphb.supabase.co/pg-meta/default/query', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVra2d1YWRka25sc214cnlocGhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NjgzMiwiZXhwIjoyMDg4NjUyODMyfQ.Wz5RDvkMLehhXsIyRH8dRXKa8mibSLymSFAQtqcjI2k',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVra2d1YWRka25sc214cnlocGhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NjgzMiwiZXhwIjoyMDg4NjUyODMyfQ.Wz5RDvkMLehhXsIyRH8dRXKa8mibSLymSFAQtqcjI2k',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Status:', res.status);
  const data = await res.text();
  console.log('Response:', data.substring(0, 1000));

  if (!res.ok) {
    console.log('\n--- Se non funziona, prova dalla Supabase Dashboard ---');
    console.log('https://supabase.com/dashboard/project/ukkguaddknlsmxryhphb/sql');
    console.log('Incolla il contenuto di: supabase/migrations/001_create_comments.sql');
  }

  // Verifica
  const { data: check, error } = await supabase.from('comments').select('id').limit(0);
  if (error) {
    console.log('\nVerifica: tabella NON trovata -', error.message);
  } else {
    console.log('\n✓ Tabella comments creata con successo!');
  }
}

run().catch(console.error);
