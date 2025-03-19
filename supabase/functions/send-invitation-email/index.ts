
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface InvitationEmailRequest {
  name: string;
  email: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, role } = await req.json() as InvitationEmailRequest;

    if (!name || !email) {
      throw new Error('Missing required fields: name and email are required');
    }

    // Get Mailchimp API key from environment
    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    if (!apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    // Create app URL for login
    const appUrl = Deno.env.get("APP_URL") || "https://app.zuitzerland.ch";

    // Setup recipients for the email
    const recipients = [
      {
        email: email,
        name: name,
        type: "to"
      }
    ];

    // Prepare the data for Mailchimp Mandrill API with merge variables
    const mailchimpData = {
      key: apiKey,
      template_name: "invite-to-portal", // Using the specified template
      template_content: [], // For transactional emails, this is often empty
      message: {
        to: recipients,
        from_email: "team@zuitzerland.ch",
        from_name: "Zuitzerland Team",
        subject: "You have been invited to join Zuitzerland",
        merge_language: "mailchimp",
        global_merge_vars: [
          { 
            name: "FNAME", 
            content: name 
          },
          {
            name: "ROLE",
            content: role.replace('-', ' ') // Format role for display (e.g., "co-curator" to "co curator")
          },
          {
            name: "LOGIN_URL",
            content: appUrl
          }
        ],
        headers: {
          "Reply-To": "team@zuitzerland.ch"
        }
      }
    };

    console.log('Sending invitation email to:', email);
    
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
    console.log('Invitation email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent successfully" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-invitation-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
