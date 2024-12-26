import { serve } from 'https://deno.fresh.dev/server.ts'

serve(async (req) => {
  const token = Deno.env.get('MAPBOX_TOKEN')
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Mapbox token not configured' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ token }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
})