'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function ListItemPage() {
  const { user } = useUser()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', category: 'Tools', price_per_day: '', security_deposit: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('resources').insert([{
      ...form,
      owner_id: user.id,
      price_per_day: parseFloat(form.price_per_day),
      security_deposit: parseFloat(form.security_deposit),
    }])
    if (error) { setMsg('Error: ' + error.message) }
    else { setMsg('Listed successfully!'); setTimeout(() => router.push('/my-listings'), 1500) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">List a Tool or Service</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input required placeholder="Name (e.g. Drill Machine)" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          <textarea required placeholder="Description" rows={3} value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {['Tools','Electronics','Garden','Sports','Services','Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input required type="number" placeholder="Price per day (₹)" value={form.price_per_day}
            onChange={e => setForm({...form, price_per_day: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          <input required type="number" placeholder="Security deposit (₹)" value={form.security_deposit}
            onChange={e => setForm({...form, security_deposit: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          {msg && <p className="text-green-500 text-sm">{msg}</p>}
          <button type="submit" disabled={loading}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-50">
            {loading ? 'Listing...' : 'List Item'}
          </button>
        </form>
      </div>
    </div>
  )
}