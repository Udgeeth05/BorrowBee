'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function RequestsPage() {
  const { user } = useUser()
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('borrow_requests')
      .select('*, resources(name, price_per_day, owner_id), profiles!borrow_requests_borrower_id_fkey(name, reputation_score)')
      .eq('resources.owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRequests((data || []).filter(r => r.resources !== null)))
  }, [user])

const handleAction = async (id, action) => {
  await supabase.from('borrow_requests').update({ status: action }).eq('id', id)
  if (action === 'approved') {
    const req = requests.find(r => r.id === id)
    await supabase.from('transactions').insert([{
      request_id: id,
      borrow_date: req.request_date,
      due_date: req.return_date,
      status: 'active'
    }])
    await supabase.from('resources').update({ status: 'unavailable' }).eq('id', req.resource_id)
  }
  setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r))
  await fetch('/api/notify-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id, status: action })
  })
}

  const statusColor = s => ({ pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-600', rejected: 'bg-red-100 text-red-400' }[s])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Incoming Requests</h1>
        {requests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400">No requests yet. List a tool to start receiving requests!</p>
          </div>
        )}
        <div className="space-y-4">
          {requests.map(r => {
            const days = Math.max(1, Math.ceil((new Date(r.return_date) - new Date(r.request_date)) / (1000*60*60*24)))
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{r.resources?.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Requested by <span className="text-gray-700 font-medium">{r.profiles?.name}</span> · ⭐ {r.profiles?.reputation_score}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-3 text-sm mb-4">
                  <div><p className="text-gray-400 text-xs">From</p><p className="font-medium">{r.request_date}</p></div>
                  <div><p className="text-gray-400 text-xs">Return</p><p className="font-medium">{r.return_date}</p></div>
                  <div><p className="text-gray-400 text-xs">Duration</p><p className="font-medium">{days} day{days > 1 ? 's' : ''}</p></div>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-3">
                    <button onClick={() => handleAction(r.id, 'approved')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium">
                      ✅ Approve
                    </button>
                    <button onClick={() => handleAction(r.id, 'rejected')}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-500 py-2 rounded-xl text-sm font-medium">
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}