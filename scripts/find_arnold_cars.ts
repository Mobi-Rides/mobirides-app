
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findArnoldCars() {
  console.log("Searching for 'Arnold'...");

  // 1. Find User ID for "Arnold" in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%Arnold%');

  if (profileError) {
    console.error("Profile Search Error:", profileError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("No profile found with name like 'Arnold'.");
    // Fallback: Check if we can search auth users (not possible with standard query usually, but let's try via admin)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const arnoldUser = users.find(u => 
      u.email?.toLowerCase().includes('arnold') || 
      u.user_metadata?.full_name?.toLowerCase().includes('arnold')
    );
    
    if (arnoldUser) {
        console.log(`Found Arnold in Auth: ${arnoldUser.id} (${arnoldUser.email})`);
        await listCars(arnoldUser.id);
    } else {
        console.log("No Arnold found in Auth either.");
    }
    return;
  }

  console.log(`Found ${profiles.length} profile(s) for Arnold:`);
  for (const p of profiles) {
    console.log(`- ${p.full_name} (ID: ${p.id})`);
    await listCars(p.id);
  }
}

async function listCars(ownerId: string) {
    const { data: cars } = await supabase
        .from('cars')
        .select('id, brand, model, price_per_day')
        .eq('owner_id', ownerId);
        
    if (cars && cars.length > 0) {
        console.log(`  🚗 Cars owned by this user:`);
        cars.forEach(c => console.log(`     * ${c.brand} ${c.model} - BWP ${c.price_per_day} (ID: ${c.id})`));
    } else {
        console.log(`  ❌ No cars found for this user.`);
    }
}

findArnoldCars();
