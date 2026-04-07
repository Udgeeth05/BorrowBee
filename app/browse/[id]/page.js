'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
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
  const [bookedRanges, setBookedRanges] = useState([])
  const [isAvailable, setIsAvailable] = useState(null)

  useEffect(() => {
    async function fetchItem() {
      const { data } = await supabase
        .from('resources')
        .select('*, profiles(name, reputation_score, email)')
        .eq('id', id)
        .single()
      setItem(data)
    }

    async function fetchBookedDates() {
      const { data } = await supabase
        .from('borrow_requests')
        .select('request_date, return_date')
        .eq('resource_id', id)
        .eq('status', 'approved')
      setBookedRanges(data || [])
    }

    fetchItem()
    fetchBookedDates()
  }, [id])

  // Check availability whenever dates change
  useEffect(() => {
    async function checkDates() {
      if (!fromDate || !toDate) { setIsAvailable(null); return }
      const { data } = await supabase.rpc('check_availability', {
        p_resource_id: id,
        p_from: fromDate,
        p_to: toDate
      })
      setIsAvailable(data)
      if (!data) setMsg('⚠️ These dates conflict with an existing booking. Please choose different dates.')
      else setMsg('')
    }
    checkDates()
  }, [fromDate, toDate, id])

  const handleBooking = async () => {
    if (!user) { router.push('/sign-in'); return }
    if (!fromDate || !toDate) { setMsg('Please select both dates'); return }
    if (!isAvailable) { setMsg('These dates are not available. Please choose different dates.'); return }

    setLoading(true)

    // Double-check availability right before inserting (race condition protection)
    const { data: available } = await supabase.rpc('check_availability', {
      p_resource_id: id,
      p_from: fromDate,
      p_to: toDate
    })

    if (!available) {
      setMsg('Sorry! Someone just booked this item. Please choose different dates.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('borrow_requests').insert([{
      resource_id: id,
      borrower_id: user.id,
      request_date: fromDate,
      return_date: toDate,
      status: 'pending'
    }])

    if (error) {
      setMsg('Error: ' + error.message)
      setLoading(false)
      return
    }

    setMsg('✅ Booking request sent! Waiting for owner approval.')

    // After successful insert, send email to lender
    const { data: insertedRequest } = await supabase
      .from('borrow_requests')
      .select('id')
      .eq('resource_id', id)
      .eq('borrower_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (insertedRequest) {
      await fetch('/api/notify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: insertedRequest.id })
      })
    }

    setLoading(false)
  }

  // Format booked ranges for display
  const formatBookedRanges = () => {
    if (bookedRanges.length === 0) return null
    return bookedRanges.map((r, i) => (
      <span key={i} className="text-xs bg-red-50 text-red-400 px-2 py-1 rounded-full">
        {r.request_date} → {r.return_date}
      </span>
    ))
  }

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  )

  const days = fromDate && toDate
    ? Math.max(1, Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000*60*60*24)))
    : 0
  const total = days * item.price_per_day

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/browse" className="text-gray-500 hover:text-gray-800 text-sm">← Back to Browse</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left */}
        <div>
          <div className="bg-yellow-50 rounded-2xl h-64 flex items-center justify-center text-8xl mb-6">
            {item.category === 'Tools' ? '🔧' : item.category === 'Electronics' ? '💻' : item.category === 'Garden' ? '🌱' : '📦'}
          </div>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{item.category}</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-2">{item.name}</h1>
          <p className="text-gray-500 mb-6">{item.description}</p>

          {/* Booked dates warning */}
          {bookedRanges.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-red-500 mb-2">Already booked on these dates:</p>
              <div className="flex flex-wrap gap-2">{formatBookedRanges()}</div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">Pricing</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price per day</span>
              <span className="font-semibold text-yellow-500">₹{item.price_per_day}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Security deposit</span>
              <span className="font-semibold text-gray-700">₹{item.security_deposit}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold ${item.status === 'available' ? 'text-green-500' : 'text-red-400'}`}>
                {item.status}
              </span>
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

        {/* Right — Booking */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Book this Item</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">From date</label>
                <input type="date" value={fromDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Return date</label>
                <input type="date" value={toDate}
                  min={fromDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>

              {/* Availability indicator */}
              {isAvailable !== null && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${isAvailable ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {isAvailable ? '✅ These dates are available!' : '❌ Dates not available'}
                </div>
              )}

              {days > 0 && isAvailable && (
                <div className="bg-yellow-50 rounded-xl h-40 flex items-center justify-center mb-4 overflow-hidden">
                    {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                    <span className="text-5xl">
                        {item.category === 'Tools' ? '🔧' : item.category === 'Electronics' ? '💻' : item.category === 'Garden' ? '🌱' : '📦'}
                    </span>
                    )}
                </div>
              )}

              {msg && (
                <p className={`text-sm ${msg.includes('Error') || msg.includes('⚠️') || msg.includes('Sorry') ? 'text-red-400' : 'text-green-500'}`}>
                  {msg}
                </p>
              )}

              <button onClick={handleBooking}
                disabled={loading || !isAvailable || item.status !== 'available'}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-lg">
                {loading ? 'Sending...' : 'Request Booking'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                You won&apos;t be charged until the lender approves your request
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}