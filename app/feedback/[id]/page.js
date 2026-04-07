'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'

export default function FeedbackPage() {
  const { id } = useParams()
  const { user } = useUser()
  const router = useRouter()
  const [request, setRequest] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('borrow_requests')
      .select('*, resources(name, owner_id), transactions(id)')
      .eq('id', id).single()
      .then(({ data }) => setRequest(data))
  }, [id])

  const submit = async () => {
    if (!request?.transactions?.[0]?.id) { setMsg('No transaction found'); return }
    const toUser = user.id === request.borrower_id ? request.resources.owner_id : request.borrower_id
    const { error } = await supabase.from('feedback').insert([{
      transaction_id: request.transactions[0].id,
      from_user_id: user.id,
      to_user_id: toUser,
      rating,
      comments: comment,
    }])
    if (!error) {
      const { data: allFeedback } = await supabase.from('feedback').select('rating').eq('to_user_id', toUser)
      const avg = allFeedback.reduce((a, b) => a + b.rating, 0) / allFeedback.length
      await supabase.from('profiles').update({ reputation_score: Math.round(avg * 10) / 10 }).eq('id', toUser)
      setMsg('Feedback submitted! Thank you.')
      setTimeout(() => router.push('/dashboard'), 1500)
    } else setMsg('Error: ' + error.message)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Leave Feedback</h1>
        <p className="text-gray-400 text-sm mb-6">For: {request?.resources?.name}</p>

        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">Rating</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setRating(star)}
                className={`text-3xl transition ${rating >= star ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-500 block mb-2">Comment</label>
          <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="How was the experience?"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        {msg && <p className={`text-sm mb-4 ${msg.includes('Error') ? 'text-red-400' : 'text-green-500'}`}>{msg}</p>}

        <button onClick={submit} className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl font-semibold">
          Submit Feedback
        </button>
      </div>
    </div>
  )
}