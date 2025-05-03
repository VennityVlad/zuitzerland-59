
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constants
const MEERKAT_API_BASE = "https://meerkat.events/api/v1"

// Get the MEERKAT_AUTH_SECRET from environment variables
const MEERKAT_AUTH_SECRET = Deno.env.get('MEERKAT_AUTH_SECRET') || ''
const MEERKAT_CONFERENCE_ID = Deno.env.get('MEERKAT_CONFERENCE_ID') || ''

// Function to create a random UID (capital letters and numbers)
function generateMeerkatUID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let uid = ''
  for (let i = 0; i < 8; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return uid
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    if (!MEERKAT_AUTH_SECRET) {
      throw new Error('MEERKAT_AUTH_SECRET is not configured')
    }
    
    if (!MEERKAT_CONFERENCE_ID) {
      throw new Error('MEERKAT_CONFERENCE_ID is not configured')
    }
    
    // Parse request body
    const { eventId } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get event details from database
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      throw new Error(`Event not found: ${eventError?.message || 'No event data'}`)
    }
    
    // Check if event already has a Meerkat UID
    if (event.meerkat_uid) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Event already has a Meerkat Q&A session',
          meerkatUrl: event.meerkat_url,
          meerkatUID: event.meerkat_uid
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Generate a unique UID for the Meerkat event
    const meerkatUID = generateMeerkatUID()
    
    // Determine submission type (default to "talk" if not specified)
    let submissionType = "talk"
    if (event.title.toLowerCase().includes("workshop")) {
      submissionType = "workshop"
    } else if (event.title.toLowerCase().includes("panel")) {
      submissionType = "panel"
    }
    
    // Process speakers field - use as string rather than array
    let speakersString = event.speakers || ''
    
    // Create event payload for Meerkat API by only including non-null fields
    const basePayload = {
      uid: meerkatUID,
      title: event.title,
      submissionType: submissionType,
      start: event.start_date,
      end: event.end_date,
    }
    
    // Add optional fields only if they exist and aren't null/undefined
    const payload = { ...basePayload }
    
    if (event.description) {
      payload.description = event.description
      payload.abstract = event.description // Using description for abstract too if available
    }
    
    if (speakersString) {
      payload.speakers = speakersString
    }
    
    // IMPORTANT FIX: Wrap the payload in an array as required by the Meerkat API
    const meerkatPayload = [payload]
    
    console.log('Sending payload to Meerkat API:', meerkatPayload)
    
    // Ensure the conference ID is treated as an integer
    const conferenceId = parseInt(MEERKAT_CONFERENCE_ID)
    if (isNaN(conferenceId)) {
      throw new Error(`Invalid conference ID: ${MEERKAT_CONFERENCE_ID}`)
    }
    
    // Make request to Meerkat API with improved error handling
    const meerkatResponse = await fetch(
      `${MEERKAT_API_BASE}/conferences/${conferenceId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEERKAT_AUTH_SECRET}`
        },
        body: JSON.stringify(meerkatPayload)
      }
    )
    
    // Get the raw response text first for better debugging
    const responseText = await meerkatResponse.text()
    
    // Try to parse as JSON if possible
    let meerkatData
    try {
      meerkatData = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse Meerkat API response as JSON:', responseText)
      throw new Error(`Meerkat API returned non-JSON response: ${responseText}`)
    }
    
    if (!meerkatResponse.ok) {
      console.error('Meerkat API error response:', meerkatData)
      throw new Error(`Meerkat API error: ${JSON.stringify(meerkatData)}`)
    }
    
    // Construct the Meerkat event URL
    const meerkatUrl = `https://meerkat.events/e/${meerkatUID}`
    
    // Update the event in the database with Meerkat information
    const { error: updateError } = await supabase
      .from('events')
      .update({
        meerkat_enabled: true,
        meerkat_uid: meerkatUID,
        meerkat_url: meerkatUrl,
        meerkat_status: 'active'
      })
      .eq('id', eventId)
    
    if (updateError) {
      throw new Error(`Failed to update event with Meerkat info: ${updateError.message}`)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        meerkatUrl,
        meerkatUID
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error creating Meerkat event:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
