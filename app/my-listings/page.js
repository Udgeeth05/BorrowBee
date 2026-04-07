'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function MyListings() {
  const { user } = useUser()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('resources').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []))
  }, [user])

  const toggleStatus = async (id, current) => {
    const next = current === 'available' ? 'unavailable' : 'available'
    await supabase.from('resources').update({ status: next }).eq('id', id)
    setItems(items.map(i => i.id === id ? { ...i, status: next } : i))
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('resources').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Dashboard</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
          <Link href="/list-item" className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Add New</Link>
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 mb-4">You haven&apos;t listed anything yet.</p>
            <Link href="/list-item" className="bg-yellow-400 text-white px-6 py-2 rounded-xl font-medium">List Your First Tool</Link>
          </div>
        )}

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {item.category === 'Tools' ? '🔧' : item.category === 'Electronics' ? '💻' : '📦'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-400">{item.category} · ₹{item.price_per_day}/day · Deposit ₹{item.security_deposit}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${item.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {item.status}
                </span>
                <button onClick={() => toggleStatus(item.id, item.status)}
                  className="text-xs border border-gray-200 px-3 py-1 rounded-xl hover:bg-gray-50 text-gray-600">
                  {item.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="text-xs border border-red-100 px-3 py-1 rounded-xl hover:bg-red-50 text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}