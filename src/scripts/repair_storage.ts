
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
let envConfig = {};
if (fs.existsSync(envLocalPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
} else if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
}
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing Supabase Config (Need SERVICE_KEY)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function repairBuckets() {
    console.log('🔧 Checking Storage Buckets...');

    const requiredBuckets = ['insurance-policies', 'insurance-claims'];
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Failed to list buckets:', listError);
        return;
    }

    const existingNames = existingBuckets.map(b => b.name);
    console.log('Found Buckets:', existingNames);

    for (const bucketName of requiredBuckets) {
        if (!existingNames.includes(bucketName)) {
            console.log(`⚠️ Bucket '${bucketName}' is MISSING. Creating it...`);

            const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: bucketName === 'insurance-claims' ? 10485760 : 5242880, // 10MB or 5MB
                allowedMimeTypes: bucketName === 'insurance-claims'
                    ? ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
                    : ['application/pdf']
            });

            if (createError) {
                console.error(`❌ Failed to create '${bucketName}':`, createError);
            } else {
                console.log(`✅ Created bucket '${bucketName}'`);
            }
        } else {
            console.log(`✅ Bucket '${bucketName}' exists.`);
        }
    }
}

repairBuckets();
