
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the appropriate API key based on the environment
    const requestFinanceApiKey = Deno.env.get(
      Deno.env.get('DENO_ENV') === 'development' 
        ? 'REQUEST_FINANCE_TEST_API_KEY' 
        : 'REQUEST_FINANCE_API_KEY'
    );

    if (!requestFinanceApiKey) {
      console.error('No API key found');
      throw new Error('API key not configured');
    }
    
    // Get all invoices that need status update
    const { data: invoices, error: dbError } = await supabase
      .from('invoices')
      .select('id, request_invoice_id, status, paid_at');
      
    if (dbError) {
      console.error('Error fetching invoices:', dbError);
      throw dbError;
    }

    if (!invoices || invoices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No invoices found', updated: [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    const updatedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        try {
          console.log(`Fetching status for invoice ${invoice.request_invoice_id}`);
          const response = await fetch(`https://api.request.finance/invoices/${invoice.request_invoice_id}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': requestFinanceApiKey
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch invoice ${invoice.request_invoice_id}:`, response.status);
            return null;
          }

          const data = await response.json();
          console.log(`Received status for invoice ${invoice.request_invoice_id}:`, data.status);
          
          // Map Request Finance status to our status
          let status = 'pending';
          if (data.status === 'paid') {
            status = 'paid';
          } else if (data.status === 'canceled') {
            status = 'cancelled';
          } else if (new Date(data.paymentTerms.dueDate) < new Date()) {
            status = 'overdue';
          }

          // Check if we need to update the status or payment date
          let paidAt = invoice.paid_at;
          let updateNeeded = status !== invoice.status;
          
          // Check for paymentDate in paymentMetadata
          if (data.paymentMetadata && data.paymentMetadata.paymentDate) {
            const paymentDate = data.paymentMetadata.paymentDate;
            
            // Only update if the payment date is different or missing
            if (!paidAt || new Date(paidAt).toISOString() !== new Date(paymentDate).toISOString()) {
              paidAt = paymentDate;
              updateNeeded = true;
              console.log(`Found payment date in metadata for invoice ${invoice.id}, date: ${paidAt}`);
            }
          }
          // If no paymentMetadata but status is changing to paid or is already paid but missing paid_at,
          // fall back to checking the declareReceivedPayment event
          else if ((status === 'paid' && (invoice.status !== 'paid' || !invoice.paid_at)) && 
              data.events && Array.isArray(data.events)) {
            
            const paymentEvent = data.events.find((event: any) => event.name === "declareReceivedPayment");
            
            if (paymentEvent && paymentEvent.date) {
              paidAt = paymentEvent.date;
              updateNeeded = true;
              console.log(`Found payment event for invoice ${invoice.id}, date: ${paidAt}`);
            }
          }

          // Only update if something changed
          if (updateNeeded) {
            const updateData: { status: string; paid_at?: string | null } = { status };
            
            // Only include paid_at in the update if it's different or if status is changing to paid
            if (status === 'paid') {
              updateData.paid_at = paidAt;
            }
            
            const { error: updateError } = await supabase
              .from('invoices')
              .update(updateData)
              .eq('id', invoice.id);

            if (updateError) {
              console.error(`Failed to update invoice ${invoice.id}:`, updateError);
              return null;
            }

            console.log(`Successfully updated invoice ${invoice.id} to status: ${status}, paid_at: ${paidAt || 'null'}`);
            return { id: invoice.id, status, paid_at: paidAt };
          } else {
            console.log(`No update needed for invoice ${invoice.id}, status and payment date unchanged`);
            return null;
          }
        } catch (error) {
          console.error(`Error processing invoice ${invoice.request_invoice_id}:`, error);
          return null;
        }
      })
    );

    const validUpdates = updatedInvoices.filter(Boolean);
    console.log(`Successfully processed ${validUpdates.length} invoices`);

    return new Response(
      JSON.stringify({ 
        message: `Updated ${validUpdates.length} invoices`,
        updated: validUpdates
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in get-invoice-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
