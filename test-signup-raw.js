
const SUPABASE_URL = 'https://putjowciegpzdheideaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dGpvd2NpZWdwemRoZWlkZWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTQ5MTQsImV4cCI6MjA1MDUzMDkxNH0.p3UPDQc4Y9r1BbMB4cPssPKNvoj5fbf9b9M40x6724o';

async function testSignup() {
    const timestamp = Date.now();
    const email = `automated-test-${timestamp}@mobirides.com`;
    const password = `Password${timestamp}!`;

    console.log(`🔄 Attempting to sign up ${email}...`);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password,
            data: {
                full_name: `Automated Test User ${timestamp}`
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Signup failed:', data);
        return;
    }

    console.log('✅ Signup successful!');
    console.log('User ID:', data.id || (data.user && data.user.id));
    console.log('Email:', email);
    console.log('Password:', password);

    if (data.session) {
        console.log('✅ Session received immediately (Email confirmation disabled or auto-confirmed).');
    } else {
        console.log('⚠️ No session received. Email confirmation might be required.');
    }

    return { email, password };
}

testSignup().catch(console.error);
