
import { corsHeaders } from "../_shared/cors.ts";

interface RevokeAccessRequest {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { email }: RevokeAccessRequest = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Get Privy credentials from environment variables
    const appId = Deno.env.get("PRIVY_APP_ID");
    const appSecret = Deno.env.get("PRIVY_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error('Privy credentials not configured');
    }

    // Base64 encoding for Authorization header
    const base64Auth = btoa(`${appId}:${appSecret}`);

    console.log(`Attempting to revoke access for ${email}`);

    // First, find the user ID by email
    const usersUrl = `https://auth.privy.io/api/v1/users`;
    const searchResponse = await fetch(`${usersUrl}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'privy-app-id': appId
      }
    });

    const usersData = await searchResponse.json();
    console.log('User search response:', JSON.stringify(usersData));
    
    if (!usersData.users || usersData.users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No user found with this email" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get the user ID from the search results
    const userId = usersData.users[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Delete the user using Privy's API
    const deleteUrl = `https://auth.privy.io/api/v1/users/${userId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'privy-app-id': appId
      }
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('Failed to delete user:', errorText);
      throw new Error(`Failed to delete user: ${errorText}`);
    }

    console.log(`Successfully deleted user ${userId}`);

    // Step 2 (optional): Remove user from allowlist if present
    // This is a backup step to ensure user can't sign in again
    const allowlistUrl = `https://auth.privy.io/api/v1/apps/${appId}/allowlist`;
    
    // First check if user is in allowlist
    const getAllowlistResponse = await fetch(`${allowlistUrl}?search=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'privy-app-id': appId
      }
    });
    
    const allowlistData = await getAllowlistResponse.json();
    console.log('Allowlist response structure:', JSON.stringify(allowlistData));
    
    let allowlistEntry = null;
    let removedFromAllowlist = false;
    
    // More defensive coding to handle different response formats
    if (allowlistData && typeof allowlistData === 'object') {
      // Check if entries exists and is an array
      if (Array.isArray(allowlistData.entries)) {
        allowlistEntry = allowlistData.entries.find((entry) => 
          entry.type === 'email' && entry.value === email
        );
      }
    }
    
    // If found in allowlist, remove
    if (allowlistEntry) {
      console.log(`User found in allowlist with ID ${allowlistEntry.id}, removing...`);
      
      const removeResponse = await fetch(`${allowlistUrl}/${allowlistEntry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'privy-app-id': appId
        }
      });
      
      if (!removeResponse.ok) {
        console.error('Failed to remove from allowlist:', await removeResponse.text());
      } else {
        console.log('Successfully removed from allowlist');
        removedFromAllowlist = true;
      }
    } else {
      console.log('User not found in allowlist or already removed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access successfully revoked", 
        details: {
          userId,
          deletedUser: true,
          removedFromAllowlist
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in revoke-privy-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
