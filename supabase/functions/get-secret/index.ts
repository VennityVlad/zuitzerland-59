
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  secretName: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { secretName } = body

    // Validate secret name
    const allowedSecrets = ['PRIVY_APP_ID'];
    if (!allowedSecrets.includes(secretName)) {
      throw new Error('Invalid secret name requested');
    }

    // Get the secret value from environment variables
    const secretValue = Deno.env.get(secretName);
    if (!secretValue) {
      throw new Error(`Secret ${secretName} not found`);
    }

    // Return the secret value
    return new Response(
      JSON.stringify({
        secret: secretValue
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
