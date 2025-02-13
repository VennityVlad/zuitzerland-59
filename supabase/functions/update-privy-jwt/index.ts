
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  jwt: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jwt, userId } = await req.json() as RequestBody;

    if (!jwt || !userId) {
      throw new Error('JWT and userId are required');
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify and decode the JWT
    const decoded = jose.decodeJwt(jwt);
    
    if (!decoded) {
      throw new Error('Invalid JWT');
    }

    console.log('Decoded JWT:', decoded);

    // Update the profile with JWT claims
    const { data: profile, error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        jwt_claims: decoded,
        jwt_token: jwt
      })
      .eq('privy_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log('Profile updated successfully:', profile);

    return new Response(
      JSON.stringify({ 
        message: 'JWT claims updated successfully',
        profile 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
