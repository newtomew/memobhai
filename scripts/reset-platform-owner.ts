/**
 * Reset platform owner Supabase passwords without wiping demo data.
 * Usage: npx tsx scripts/reset-platform-owner.ts
 */
import { createClient } from '@supabase/supabase-js';

const OWNER_PASSWORD = 'Pass@2026(memobhai)';
const EMAILS = [
  'zahidhoshen.masud@gmail.com',
  'admin@memobhai.com',
];

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetPassword(email: string) {
  const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const user = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: OWNER_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Create failed for ${email}: ${error.message}`);
    console.log(`✓ Created ${email} (authId: ${data.user?.id})`);
    return;
  }
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: OWNER_PASSWORD });
  if (error) throw new Error(`Reset failed for ${email}: ${error.message}`);
  console.log(`✓ Password reset for ${email}`);
}

async function main() {
  console.log('Resetting platform owner passwords...');
  for (const email of EMAILS) {
    await resetPassword(email);
  }
  console.log(`\nPassword set to: ${OWNER_PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
