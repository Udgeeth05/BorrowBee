import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-yellow-500">🐝 BorrowBee</h1>
        <div className="flex gap-4 items-center">
          <Link href="/browse" className="text-gray-600 hover:text-gray-900">
            Browse
          </Link>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="text-gray-700 font-medium">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-4">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">Borrow. Share. Save.</h2>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          Rent tools and services from your community. List what you own. Borrow what you need.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/browse" className="bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-semibold text-lg">Browse Tools</Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="border border-gray-200 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold text-lg text-gray-700">
                List Your Tool
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-8">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">How BorrowBee Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', icon: '📋', title: 'List your tool', desc: 'Add your unused tools or services with price and deposit amount.' },
            { step: '2', icon: '🔍', title: 'Borrower books it', desc: 'Others find your listing, request a booking, and pay the deposit.' },
            { step: '3', icon: '✅', title: 'Return & get paid', desc: 'Item is returned, deposit released, both parties leave feedback.' },
          ].map(item => (
            <div key={item.step} className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h4 className="font-semibold text-gray-800 mb-2">{item.title}</h4>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2025 BorrowBee · Community Tool Sharing Platform
      </footer>
    </main>
  )
}