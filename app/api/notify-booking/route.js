import { sendEmail, emailTemplates } from '@/lib/email'
import { supabase } from '@/lib/supabase'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(req) {
  const user = await currentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { requestId } = await req.json()

  // Get full request details
  const { data: request } = await supabase
    .from('borrow_requests')
    .select('*, resources(name, owner_id), profiles!borrow_requests_borrower_id_fkey(name, email)')
    .eq('id', requestId)
    .single()

  if (!request) return new Response('Not found', { status: 404 })

  // Get lender email
  const { data: lender } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', request.resources.owner_id)
    .single()

  if (lender?.email) {
    const template = emailTemplates.bookingReceived(
      request.profiles.name,
      request.resources.name,
      request.request_date,
      request.return_date
    )
    await sendEmail({ to: lender.email, ...template })
  }

  return new Response('OK')
}