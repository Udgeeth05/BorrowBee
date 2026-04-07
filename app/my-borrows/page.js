'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function MyBorrows() {
  const { user } = useUser()
  const [borrows, setBorrows] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('borrow_requests')
      .select('*, resources(name, price_per_day, security_deposit, category, profiles(name))')
      .eq('borrower_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBorrows(data || []))
  }, [user])

  const statusColor = s => ({ pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-600', rejected: 'bg-red-100 text-red-400', completed: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100')
  const statusIcon = s => ({ pending: '⏳', approved: '✅', rejected: '❌', completed: '🏁' }[s] || '❓')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Borrows</h1>

        {borrows.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 mb-4">You haven&apos;t borrowed anything yet.</p>
            <Link href="/browse" className="bg-yellow-400 text-white px-6 py-2 rounded-xl font-medium">Browse Tools</Link>
          </div>
        )}

        <div className="space-y-4">
          {borrows.map(b => {
            const days = Math.max(1, Math.ceil((new Date(b.return_date) - new Date(b.request_date)) / (1000*60*60*24)))
            const total = days * (b.resources?.price_per_day || 0)
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-xl">
                      {b.resources?.category === 'Tools' ? '🔧' : b.resources?.category === 'Electronics' ? '💻' : '📦'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{b.resources?.name}</h3>
                      <p className="text-sm text-gray-400">From {b.resources?.profiles?.name}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${statusColor(b.status)}`}>
                    {statusIcon(b.status)} {b.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-3 text-sm">
                  <div><p className="text-gray-400 text-xs">From</p><p className="font-medium">{b.request_date}</p></div>
                  <div><p className="text-gray-400 text-xs">Return by</p><p className="font-medium">{b.return_date}</p></div>
                  <div><p className="text-gray-400 text-xs">Total cost</p><p className="font-medium text-yellow-500">₹{total}</p></div>
                </div>
                {b.status === 'completed' && (
                  <div className="mt-3">
                    <Link href={`/feedback/${b.id}`} className="text-sm text-yellow-500 hover:underline font-medium">Leave feedback →</Link>
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