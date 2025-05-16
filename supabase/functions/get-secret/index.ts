
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  secretName: string;
  isPreview?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { secretName, isPreview } = body

    // Validate secret name
    const allowedSecrets = ['PRIVY_APP_ID', 'PRIVY_APP_ID_PREVIEW'];
    if (!allowedSecrets.includes(secretName)) {
      throw new Error('Invalid secret name requested');
    }

    // Determine which secret to retrieve based on environment
    let secretToRetrieve = secretName;
    
    // If requesting PRIVY_APP_ID and isPreview is true, use preview version instead
    if (secretName === 'PRIVY_APP_ID' && isPreview === true) {
      secretToRetrieve = 'PRIVY_APP_ID_PREVIEW';
      console.log('Using preview Privy App ID');
    } else {
      console.log('Using production Privy App ID');
    }
    
    // Get the secret value from environment variables
    const secretValue = Deno.env.get(secretToRetrieve);
    if (!secretValue) {
      if (secretToRetrieve === 'PRIVY_APP_ID_PREVIEW') {
        // Fallback to production key if preview key is not set
        const fallbackSecret = Deno.env.get('PRIVY_APP_ID');
        if (fallbackSecret) {
          console.log('Preview key not found, falling back to production key');
          return new Response(
            JSON.stringify({
              secret: fallbackSecret
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          );
        }
      }
      throw new Error(`Secret ${secretToRetrieve} not found`);
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
