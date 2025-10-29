import { serve } from "std/http/server.ts"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error("Unauthorized")
    }

    const { 
      full_name, 
      dateOfBirth, 
      nationalIdNumber, 
      emergencyContact 
    } = await req.json()

    // Update profiles table
    const profileUpdates: any = {}
    if (full_name !== undefined) profileUpdates.full_name = full_name
    if (emergencyContact?.name !== undefined) profileUpdates.emergency_contact_name = emergencyContact.name
    if (emergencyContact?.phoneNumber !== undefined) profileUpdates.emergency_contact_phone = emergencyContact.phoneNumber

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)

      if (profileError) throw profileError
    }

    // Update user_verifications personal_info
    const verificationUpdates: any = {}
    if (dateOfBirth !== undefined) verificationUpdates.dateOfBirth = dateOfBirth
    if (nationalIdNumber !== undefined) verificationUpdates.nationalIdNumber = nationalIdNumber
    if (emergencyContact !== undefined) verificationUpdates.emergencyContact = emergencyContact

    if (Object.keys(verificationUpdates).length > 0) {
      // Get current verification record
      const { data: existingVerification } = await supabaseClient
        .from('user_verifications')
        .select('id, personal_info')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingVerification) {
        // Create verification record if missing
        const { error: insertVerificationError } = await supabaseClient
          .from('user_verifications')
          .insert({
            user_id: user.id,
            personal_info: verificationUpdates,
            last_updated_at: new Date().toISOString()
          })

        if (insertVerificationError) throw insertVerificationError
      } else {
        const currentPersonalInfo = existingVerification?.personal_info || {}
        const updatedPersonalInfo = { ...currentPersonalInfo, ...verificationUpdates }

        const { error: verificationError } = await supabaseClient
          .from('user_verifications')
          .update({ 
            personal_info: updatedPersonalInfo,
            last_updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (verificationError) throw verificationError
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Profile updated successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})