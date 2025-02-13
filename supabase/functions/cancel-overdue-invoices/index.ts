
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface Invoice {
  id: string;
  request_invoice_id: string;
  due_date: string;
  status: string;
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appropriate Request Finance API key based on environment
    const requestFinanceApiKey = Deno.env.get(
      Deno.env.get('DENO_ENV') === 'development' 
        ? 'REQUEST_FINANCE_TEST_API_KEY' 
        : 'REQUEST_FINANCE_API_KEY'
    );

    if (!requestFinanceApiKey) {
      throw new Error('Could not retrieve API key');
    }

    // Get all pending invoices that are past their due date
    const currentDate = new Date().toISOString();
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, request_invoice_id, due_date, status')
      .eq('status', 'pending')
      .lt('due_date', currentDate);

    if (invoicesError) {
      throw invoicesError;
    }

    console.log(`Found ${overdueInvoices?.length || 0} overdue invoices to process`);

    // Process each overdue invoice
    const results = await Promise.all((overdueInvoices || []).map(async (invoice: Invoice) => {
      try {
        // Call Request Finance API to void the invoice
        const response = await fetch(`https://api.request.finance/api/v1/invoices/${invoice.request_invoice_id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': requestFinanceApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to cancel invoice ${invoice.request_invoice_id} in Request Finance`);
        }

        // Update invoice status in our database
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', invoice.id);

        if (updateError) {
          throw updateError;
        }

        return {
          success: true,
          invoiceId: invoice.id,
          message: 'Invoice cancelled successfully'
        };
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error);
        return {
          success: false,
          invoiceId: invoice.id,
          error: error.message
        };
      }
    }));

    return new Response(
      JSON.stringify({
        message: 'Overdue invoice cancellation completed',
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in cancel-overdue-invoices function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
