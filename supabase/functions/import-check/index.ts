
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get counts of existing records
    const { data: apartmentCount, error: apartmentError } = await supabaseClient
      .from('apartments')
      .select('*', { count: 'exact', head: true });
      
    const { data: bedroomCount, error: bedroomError } = await supabaseClient
      .from('bedrooms')
      .select('*', { count: 'exact', head: true });
      
    const { data: bedCount, error: bedError } = await supabaseClient
      .from('beds')
      .select('*', { count: 'exact', head: true });
      
    if (apartmentError) throw apartmentError;
    if (bedroomError) throw bedroomError;
    if (bedError) throw bedError;
      
    // Return counts to confirm database status
    return new Response(
      JSON.stringify({ 
        apartments: apartmentCount.length,
        bedrooms: bedroomCount.length,
        beds: bedCount.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error checking database records:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
