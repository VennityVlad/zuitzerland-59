
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileData {
  email: string;
  role?: 'admin' | 'team' | 'co-curator';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get request body
    const requestData = await req.json() as ProfileData;
    
    if (!requestData.email) {
      throw new Error('Email is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', requestData.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing profile:', checkError);
      throw checkError;
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: 'Profile already exists', profile: existingProfile }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Create new profile
    const { data, error } = await supabaseClient
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: requestData.email,
        role: requestData.role || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }

    console.log('Profile created successfully:', data);

    return new Response(
      JSON.stringify({ message: 'Profile created successfully', profile: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
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
