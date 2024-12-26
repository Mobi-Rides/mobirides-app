import { serve } from 'https://deno.fresh.dev/server.ts'

serve(async (req) => {
  const { token } = await req.json()
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Token is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // In a real implementation, you would save this to a secure storage
    // For now, we'll just verify the token format
    if (typeof token !== 'string' || !token.startsWith('pk.')) {
      throw new Error('Invalid token format')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})