
import { corsHeaders } from "../_shared/cors.ts";

interface ValidateUserRequest {
  email?: string;
  privy_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, privy_id }: ValidateUserRequest = await req.json();
    
    if (!email && !privy_id) {
      throw new Error('Either email or privy_id is required');
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Query parameter for the lookup
    const queryParam = email ? `email=eq.${encodeURIComponent(email)}` : 
                      privy_id ? `privy_id=eq.${encodeURIComponent(privy_id)}` : '';

    // Check if user is in the revoked_users table
    const response = await fetch(`${supabaseUrl}/rest/v1/revoked_users?${queryParam}&select=id,email,revoked_at`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check revocation status');
    }
    
    const revokedUsers = await response.json();
    
    // If we find a matching revoked user, the access is invalid
    const isRevoked = revokedUsers.length > 0;
    
    return new Response(
      JSON.stringify({ 
        valid: !isRevoked,
        revoked: isRevoked,
        revoked_at: isRevoked ? revokedUsers[0].revoked_at : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in validate-user-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
