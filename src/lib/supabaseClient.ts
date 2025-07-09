import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://alammewoggxtuykkltcu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYW1tZXdvZ2d4dHV5a2tsdGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjUwMTksImV4cCI6MjA2NzA0MTAxOX0.ajOfJMAF4HYNnMPxf3TAK9uBlA288yKMEzZIghVnNpI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;