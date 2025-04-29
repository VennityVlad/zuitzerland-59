
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  profileId: string;
  privyId: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, privyId, email } = await req.json() as RequestBody;
    
    if (!profileId || !privyId || !email) {
      throw new Error('Profile ID, Privy ID, and email are required');
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Create profile with admin privileges to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: profileId,
        privy_id: privyId,
        email: email,
        username: null // This will trigger the generate_username() function
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Profile created successfully',
        profile: data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
