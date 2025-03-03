
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailReminderRequest {
  invoiceId: string;
  email: string;
  firstName: string;
  lastName: string;
  invoiceAmount: number;
  dueDate: string;
  paymentLink: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, email, firstName, lastName, invoiceAmount, dueDate, paymentLink } = 
      await req.json() as EmailReminderRequest;

    if (!invoiceId || !email) {
      throw new Error('Missing required fields: invoiceId and email are required');
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
        email: "isla@zuitzerland.ch",
        name: "Isla from Zuitzerland",
        type: "bcc"
      }
    ];

    // Prepare the data for Mailchimp API with the specified structure
    const mailchimpData = {
      key: apiKey,
      template_name: "lock-it-in", // Using the requested template
      template_content: [], // For transactional emails, this is often empty
      message: {
        to: recipients,
        from_email: "isla@zuitzerland.ch",
        from_name: "Isla from Zuitzerland",
        subject: "Reminder to Pay Your Zuitzerland Invoice",
        merge_language: "mailchimp",
        global_merge_vars: [
          { 
            name: "INVOICE", 
            content: paymentLink // Using the payment link as the invoice link
          }
        ],
        headers: {
          "Reply-To": "team@zuitzerland.ch"
        }
      }
    };

    console.log('Sending reminder email to:', email);
    
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
    console.log('Email sent successfully:', result);

    // Update the invoice in database to mark that a reminder was sent
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.7");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Record that a reminder was sent for this invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        last_reminder_sent: new Date().toISOString(),
        reminder_count: supabase.rpc('increment_reminder_count', { invoice_id: invoiceId })
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice reminder status:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email reminder sent successfully" }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-email-reminder:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
