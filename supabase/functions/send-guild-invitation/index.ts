
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface GuildInvitationRequest {
  invoiceId: string;
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, profileId, email, firstName, lastName } = 
      await req.json() as GuildInvitationRequest;

    if (!invoiceId || !email || !profileId) {
      throw new Error('Missing required fields: invoiceId, profileId, and email are required');
    }

    // Get Mailchimp API key from environment
    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    if (!apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    // Setup recipients list with the specified format
    const recipients = [
      {
        email: email,
        name: firstName,
        type: "to"
      },
      {
        email: "team@zuitzerland.ch",
        name: "Zuitzerland Team",
        type: "bcc"
      },
      {
        email: "veronica@zuitzerland.ch",
        name: "Veronica from Zuitzerland",
        type: "bcc"
      }
    ];

    // Prepare the data for Mailchimp API
    const mailchimpData = {
      key: apiKey,
      template_name: "incoming-transmission-v2", // Using the requested template
      template_content: [], // For transactional emails, this is often empty
      message: {
        to: recipients,
        from_email: "team@zuitzerland.ch",
        from_name: "The Zuitzerland Team",
        subject: "Welcome to the Zuitzerland Guild",
        merge_language: "mailchimp",
        global_merge_vars: [
          { 
            name: "FNAME", 
            content: firstName
          }
        ],
        headers: {
          "Reply-To": "team@zuitzerland.ch"
        }
      }
    };

    console.log(`Sending guild invitation email to:`, email);
    
    // Call Mailchimp Transactional API (Mandrill)
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Mailchimp API error:', errorData);
      throw new Error(`Mailchimp API responded with ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log('Guild invitation email sent successfully:', result);

    // Update the profile to mark that the user has been invited
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.7");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_guild_invited: true })
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile invitation status:', updateError);
      throw new Error('Failed to update profile invitation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Guild invitation email sent successfully" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-guild-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
