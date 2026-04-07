'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState({ myListings: 0, activeborrows: 0, pendingRequests: 0, reputation: 5.0 })
  const [recentBorrows, setRecentBorrows] = useState([])
  const [recentListings, setRecentListings] = useState([])

  useEffect(() => {
    if (!user) return
    async function load() {
      // sync user profile
      await fetch('/api/sync-user', { method: 'POST' })

      const [listings, borrows, requests] = await Promise.all([
        supabase.from('resources').select('*').eq('owner_id', user.id),
        supabase.from('borrow_requests').select('*, resources(name, price_per_day)').eq('borrower_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('borrow_requests').select('*, resources!inner(owner_id)').eq('resources.owner_id', user.id).eq('status', 'pending'),
      ])
      const profile = await supabase.from('profiles').select('reputation_score').eq('id', user.id).single()

      setStats({
        myListings: listings.data?.length || 0,
        activeBorrows: borrows.data?.filter(b => b.status === 'approved').length || 0,
        pendingRequests: requests.data?.length || 0,
        reputation: profile.data?.reputation_score || 5.0,
      })
      setRecentBorrows(borrows.data || [])
      setRecentListings(listings.data?.slice(0, 3) || [])
    }
    load()
  }, [user])

  const statusColor = (s) => ({ pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-400', completed: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100 text-gray-500')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-500">🐝 BorrowBee</Link>
        <div className="flex items-center gap-6">
          <Link href="/browse" className="text-gray-500 hover:text-gray-800 text-sm">Browse</Link>
          <Link href="/list-item" className="text-gray-500 hover:text-gray-800 text-sm">List Item</Link>
          <Link href="/requests" className="text-gray-500 hover:text-gray-800 text-sm">Requests</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-gray-400 mb-8">Here&apos;s what&apos;s happening with your BorrowBee account.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'My Listings', value: stats.myListings, icon: '📋', href: '/my-listings' },
            { label: 'Active Borrows', value: stats.activeBorrows, icon: '📦', href: '/my-borrows' },
            { label: 'Pending Requests', value: stats.pendingRequests, icon: '🔔', href: '/requests' },
            { label: 'Reputation', value: `⭐ ${stats.reputation}`, icon: '🏅', href: '#' },
          ].map(s => (
            <Link href={s.href} key={s.label}>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition cursor-pointer">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Borrows */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">Recent Borrows</h2>
              <Link href="/my-borrows" className="text-sm text-yellow-500 hover:underline">View all</Link>
            </div>
            {recentBorrows.length === 0 && <p className="text-gray-400 text-sm">You haven&apos;t borrowed anything yet.</p>}
            <div className="space-y-3">
              {recentBorrows.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{b.resources?.name}</p>
                    <p className="text-xs text-gray-400">{b.request_date} → {b.return_date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* My Listings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">My Listings</h2>
              <Link href="/my-listings" className="text-sm text-yellow-500 hover:underline">View all</Link>
            </div>
            {recentListings.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">You haven&apos;t listed anything yet.</p>
                <Link href="/list-item" className="bg-yellow-400 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-500">+ List a Tool</Link>
              </div>
            )}
            <div className="space-y-3">
              {recentListings.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price_per_day}/day · Deposit ₹{item.security_deposit}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'List a Tool', href: '/list-item', icon: '➕' },
            { label: 'Browse Items', href: '/browse', icon: '🔍' },
            { label: 'My Borrows', href: '/my-borrows', icon: '📦' },
            { label: 'Incoming Requests', href: '/requests', icon: '🔔' },
          ].map(a => (
            <Link href={a.href} key={a.label} className="bg-white border border-gray-100 hover:shadow-sm rounded-2xl p-4 flex items-center gap-3 transition">
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}