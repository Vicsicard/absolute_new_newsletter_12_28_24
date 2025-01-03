import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

console.log('Hello from Functions!')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Parse request body
    const body = await req.json()
    const { company_name, website_url, industry, contact_email, target_audience } = body

    // Insert company record
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .insert([
        {
          name: company_name,
          website_url,
          industry,
          contact_email,
        },
      ])
      .select()
      .single()

    if (companyError) throw companyError

    // Insert newsletter record
    const { data: newsletter, error: newsletterError } = await supabaseClient
      .from('newsletters')
      .insert([
        {
          company_id: company.id,
          target_audience,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (newsletterError) throw newsletterError

    return new Response(
      JSON.stringify({
        message: 'Newsletter setup completed!',
        company,
        newsletter,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
