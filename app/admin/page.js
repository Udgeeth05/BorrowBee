'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user } = useUser()
  const router = useRouter()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
      if (data?.role !== 'admin') router.push('/dashboard')
    }
    if (user) checkAdmin()
  }, [user, router])

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setUsers(data || []))
    supabase.from('resources').select('*, profiles(name)').then(({ data }) => setListings(data || []))
    supabase.from('transactions').select('*, borrow_requests(request_date, return_date, resources(name))').order('created_at', { ascending: false }).then(({ data }) => setTransactions(data || []))
  }, [])

  const tabs = ['users', 'listings', 'transactions']

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee Admin</Link>
        <Link href="/dashboard" className="text-sm text-gray-500">← Back</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        <div className="flex gap-3 mb-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? 'bg-yellow-400 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {tab === 'users' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name','Email','Role','Reputation','Joined'].map(h => <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>{users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-5 py-3 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>{u.role}</span></td>
                  <td className="px-5 py-3">⭐ {u.reputation_score}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'listings' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name','Category','Owner','Price/day','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>{listings.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-5 py-3 text-gray-400">{l.category}</td>
                  <td className="px-5 py-3 text-gray-600">{l.profiles?.name}</td>
                  <td className="px-5 py-3 text-yellow-500 font-medium">₹{l.price_per_day}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs ${l.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{l.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'transactions' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Item','Borrow Date','Due Date','Status','Fine'].map(h => <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>{transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{t.borrow_requests?.resources?.name}</td>
                  <td className="px-5 py-3 text-gray-400">{t.borrow_date}</td>
                  <td className="px-5 py-3 text-gray-400">{t.due_date}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs ${t.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{t.status}</span></td>
                  <td className="px-5 py-3 text-red-400">{t.fine_accrued > 0 ? `₹${t.fine_accrued}` : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}