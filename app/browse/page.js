'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function BrowsePage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const categories = ['All', 'Tools', 'Electronics', 'Garden', 'Sports', 'Services', 'Other']

  useEffect(() => {
    async function fetchItems() {
      let query = supabase.from('resources').select('*, profiles(name, reputation_score)').eq('status', 'available')
      if (category !== 'All') query = query.eq('category', category)
      if (search) query = query.ilike('name', `%${search}%`)
      const { data } = await query
      setItems(data || [])
    }
    fetchItems()
  }, [search, category])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <Link href="/sign-in" className="bg-yellow-400 text-white px-4 py-2 rounded-lg text-sm font-medium">Sign In</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Tools & Services</h1>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${category === cat ? 'bg-yellow-400 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No items found. Be the first to list something!</p>}
          {items.map(item => (
            <Link href={`/browse/${item.id}`} key={item.id}>
              <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition p-5 cursor-pointer">
                <div className="bg-yellow-50 rounded-xl h-40 flex items-center justify-center mb-4 text-5xl">
                  {item.category === 'Tools' ? '🔧' : item.category === 'Electronics' ? '💻' : item.category === 'Garden' ? '🌱' : '📦'}
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{item.category}</span>
                <h3 className="font-semibold text-gray-800 mt-2 mb-1">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-500 font-bold">₹{item.price_per_day}/day</span>
                  <span className="text-gray-400 text-xs">Deposit: ₹{item.security_deposit}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">By {item.profiles?.name} · ⭐ {item.profiles?.reputation_score}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}