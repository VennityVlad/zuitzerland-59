
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const REQUEST_FINANCE_API_KEY = Deno.env.get('REQUEST_FINANCE_API_KEY') || '';

interface CreateInvoicePayload {
  invoiceData: any;
  paymentType: string;
  priceAfterDiscount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { invoiceData, paymentType, priceAfterDiscount } = await req.json() as CreateInvoicePayload;

    // Prepare Request Finance invoice data
    const requestFinanceData = {
      "meta": {
        "format": "rnf_invoice",
        "version": "0.0.3"
      },
      "creationDate": new Date().toISOString(),
      "invoiceNumber": invoiceData.invoiceNumber,
      "buyerInfo": invoiceData.buyerInfo,
      "paymentTerms": invoiceData.paymentTerms,
      "invoiceItems": [
        {
          "name": "Zuitzerland reservation",
          "quantity": 1,
          "currency": "CHF", 
          "unitPrice": paymentType === 'fiat' ? 
            priceAfterDiscount * (1 + 0.03) : // Add 3% Stripe fee for fiat
            priceAfterDiscount, // No fee for crypto
          "tax": {
            "type": "percentage",
            "amount": "3.8" // 3.8% VAT for all customers
          }
        }
      ]
    };

    // Create invoice in Request Finance
    const response = await fetch('https://api.request.finance/v2/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REQUEST_FINANCE_API_KEY}`,
      },
      body: JSON.stringify(requestFinanceData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Return success response
    return new Response(
      JSON.stringify({
        invoiceId: data.invoiceId,
        paymentLink: data.paymentLink
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
