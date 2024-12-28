import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function getCompanyById(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getLatestNewsletter(companyId: string) {
  const { data, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return data
}

export async function getActiveSubscribers(companyId: string) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('email')
    .eq('company_id', companyId)
    .eq('status', 'active')

  if (error) throw error
  return data
}

export async function updateNewsletterStatus(
  id: string,
  status: 'draft' | 'sent',
  sentAt?: string
) {
  const { error } = await supabase
    .from('newsletters')
    .update({
      status,
      sent_at: sentAt,
    })
    .eq('id', id)

  if (error) throw error
}
