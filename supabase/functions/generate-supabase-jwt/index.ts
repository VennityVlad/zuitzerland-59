
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  privyUserId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("JWT Generation: Request received");
    
    const { privyUserId } = await req.json() as RequestBody;
    
    if (!privyUserId) {
      console.error("JWT Generation: Missing Privy user ID");
      throw new Error('Privy user ID is required');
    }
    
    console.log("JWT Generation: Generating Supabase JWT for privyUserId:", privyUserId);

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("JWT Generation: Missing Supabase environment variables");
      throw new Error('Supabase configuration is missing');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Fetch the user's profile to get their profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('privy_id', privyUserId)
      .maybeSingle();
    
    if (profileError) {
      console.error("JWT Generation: Error fetching profile:", profileError);
      throw new Error('Error fetching user profile');
    }
    
    if (!profile) {
      console.error("JWT Generation: User profile not found for Privy ID:", privyUserId);
      throw new Error('User profile not found');
    }
    
    console.log("JWT Generation: Profile found:", {
      id: profile.id,
      role: profile.role,
      privyId: privyUserId
    });
    
    // Get the JWT secret from environment variables
    // Use JWT_SECRET instead of SUPABASE_JWT_SECRET
    const supabaseJwtSecret = Deno.env.get('JWT_SECRET');
    if (!supabaseJwtSecret) {
      console.error("JWT Generation: JWT_SECRET environment variable is not set");
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + 60 * 60; // 1 hour from now
    
    // Create JWT payload with claims Supabase expects
    const payload = {
      aud: 'authenticated',
      sub: profile.id, // Use profile.id as the subject (this becomes auth.uid())
      exp: expiryTime,
      iat: now,
      role: 'authenticated',
      email: `${privyUserId}@privy.io`, // Placeholder email format
      user_metadata: {
        privy_id: privyUserId,
        role: profile.role
      }
    };
    
    console.log("JWT Generation: Creating JWT with payload:", {
      sub: payload.sub,
      exp: new Date(payload.exp * 1000).toISOString(),
      iat: new Date(payload.iat * 1000).toISOString(),
      role: payload.role,
      userMetadata: payload.user_metadata
    });
    
    // Sign the JWT with the secret
    const secret = new TextEncoder().encode(supabaseJwtSecret);
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);
    
    console.log("JWT Generation: JWT generated successfully");
    
    // Return the JWT to the client
    return new Response(
      JSON.stringify({ 
        jwt,
        expiresAt: expiryTime * 1000 // Convert to milliseconds for client-side use
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('JWT Generation Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
