
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

    // Get user count from profiles table
    const { data: profilesData, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id')
      .count();

    if (profilesError) throw profilesError;
    
    const userCount = profilesData?.[0]?.count || 0;

    // Get invoice count and total revenue
    const { data: invoicesData, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select('id, price');

    if (invoicesError) throw invoicesError;
    
    const invoiceCount = invoicesData?.length || 0;
    const totalRevenue = invoicesData?.reduce((sum, invoice) => sum + (Number(invoice.price) || 0), 0) || 0;

    // Get room types count
    const { data: roomTypesData, error: roomTypesError } = await supabaseClient
      .from('room_types')
      .select('id')
      .count();

    if (roomTypesError) throw roomTypesError;
    
    const roomTypesCount = roomTypesData?.[0]?.count || 0;

    // Get events count
    const { data: eventsData, error: eventsError } = await supabaseClient
      .from('events')
      .select('id')
      .count();

    if (eventsError) throw eventsError;
    
    const eventsCount = eventsData?.[0]?.count || 0;

    // Get discount codes count
    const { data: discountsData, error: discountsError } = await supabaseClient
      .from('discounts')
      .select('id')
      .count();

    if (discountsError) throw discountsError;
    
    const discountsCount = discountsData?.[0]?.count || 0;

    // Return all metrics
    return new Response(
      JSON.stringify({
        userCount,
        invoiceCount,
        totalRevenue,
        roomTypesCount,
        eventsCount,
        discountsCount
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
