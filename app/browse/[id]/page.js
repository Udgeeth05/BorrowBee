'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'

export default function ItemDetailPage() {
  const { id } = useParams()
  const { user } = useUser()
  const router = useRouter()
  const [item, setItem] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function fetchItem() {
      const { data } = await supabase
        .from('resources')
        .select('*, profiles(name, reputation_score, email)')
        .eq('id', id)
        .single()
      setItem(data)
    }
    fetchItem()
  }, [id])

  const handleBooking = async () => {
    if (!user) { router.push('/sign-in'); return }
    if (!fromDate || !toDate) { setMsg('Please select both dates'); return }
    setLoading(true)
    const { error } = await supabase.from('borrow_requests').insert([{
      resource_id: id,
      borrower_id: user.id,
      request_date: fromDate,
      return_date: toDate,
      status: 'pending'
    }])
    if (error) setMsg('Error: ' + error.message)
    else { setMsg('Booking request sent! Waiting for owner approval.') }
    setLoading(false)
  }

  if (!item) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  const days = fromDate && toDate ? Math.max(1, Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000*60*60*24))) : 0
  const total = days * item.price_per_day

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/browse" className="text-gray-500 hover:text-gray-800 text-sm">← Back to Browse</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left — Item info */}
        <div>
          <div className="bg-yellow-50 rounded-2xl h-64 flex items-center justify-center text-8xl mb-6">
            {item.category === 'Tools' ? '🔧' : item.category === 'Electronics' ? '💻' : item.category === 'Garden' ? '🌱' : item.category === 'Sports' ? '⚽' : '📦'}
          </div>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{item.category}</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-2">{item.name}</h1>
          <p className="text-gray-500 mb-6">{item.description}</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Pricing</h3>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Price per day</span><span className="font-semibold text-yellow-500">₹{item.price_per_day}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Security deposit</span><span className="font-semibold text-gray-700">₹{item.security_deposit}</span></div>
            <div className="border-t pt-3 flex justify-between text-sm"><span className="text-gray-500">Status</span>
              <span className={`font-semibold ${item.status === 'available' ? 'text-green-500' : 'text-red-400'}`}>{item.status}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4">
            <h3 className="font-semibold text-gray-700 mb-3">About the Lender</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">
                {item.profiles?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800">{item.profiles?.name}</p>
                <p className="text-sm text-gray-400">⭐ {item.profiles?.reputation_score} reputation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Booking form */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Book this Item</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">From date</label>
                <input type="date" value={fromDate} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Return date</label>
                <input type="date" value={toDate} min={fromDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>

              {days > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Duration</span><span>{days} day{days > 1 ? 's' : ''}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rent (₹{item.price_per_day} × {days})</span><span>₹{total}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Deposit</span><span>₹{item.security_deposit}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Total to pay</span><span className="text-yellow-500">₹{total + item.security_deposit}</span></div>
                </div>
              )}

              {msg && <p className={`text-sm ${msg.includes('Error') ? 'text-red-400' : 'text-green-500'}`}>{msg}</p>}

              <button onClick={handleBooking} disabled={loading || item.status !== 'available'}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-lg">
                {loading ? 'Sending...' : 'Request Booking'}
              </button>
              <p className="text-xs text-gray-400 text-center">You won&apos;t be charged until the lender approves your request</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}