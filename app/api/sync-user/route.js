import { supabase } from '@/lib/supabase'
import { currentUser } from '@clerk/nextjs/server'

export async function POST() {
  const user = await currentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  await supabase.from('profiles').upsert({
    id: user.id,
    name: user.fullName || user.firstName,
    email: user.emailAddresses[0]?.emailAddress,
    role: 'user',
  })

  return new Response('OK')
}