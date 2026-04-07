'use client'
import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function ListItemPage() {
  const { user } = useUser()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', description: '', category: 'Tools',
    price_per_day: '', security_deposit: ''
  })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('Image must be under 5MB'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    let image_url = null

    // Upload image if selected
    if (image) {
      const fileName = `${user.id}-${Date.now()}-${image.name}`
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, image)

      if (uploadError) {
        setMsg('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }

    const { error } = await supabase.from('resources').insert([{
      ...form,
      owner_id: user.id,
      price_per_day: parseFloat(form.price_per_day),
      security_deposit: parseFloat(form.security_deposit),
      image_url,
    }])

    if (error) setMsg('Error: ' + error.message)
    else {
      setMsg('✅ Listed successfully!')
      setTimeout(() => router.push('/my-listings'), 1500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">List a Tool or Service</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Image Upload */}
          <div>
            <label className="text-sm text-gray-500 block mb-2">Item Photo (optional)</label>
            <label className="cursor-pointer block">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${preview ? 'border-yellow-300' : 'border-gray-200 hover:border-yellow-300'}`}>
                {preview ? (
                  <Image src={preview} alt="preview" width={400} height={192} className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-400 text-sm">Click to upload a photo</p>
                    <p className="text-gray-300 text-xs mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          <input required placeholder="Name (e.g. Drill Machine)"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />

          <textarea required placeholder="Description — what is it, condition, any rules?"
            rows={3} value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />

          <select value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
            className="border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {['Tools','Electronics','Garden','Sports','Services','Other'].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price per day (₹)</label>
              <input required type="number" min="1" placeholder="e.g. 150"
                value={form.price_per_day}
                onChange={e => setForm({...form, price_per_day: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Security deposit (₹)</label>
              <input required type="number" min="0" placeholder="e.g. 500"
                value={form.security_deposit}
                onChange={e => setForm({...form, security_deposit: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.includes('Error') || msg.includes('failed') ? 'text-red-400' : 'text-green-500'}`}>
              {msg}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-xl font-semibold text-lg disabled:opacity-50">
            {loading ? 'Uploading & Listing...' : '🐝 List Item'}
          </button>
        </form>
      </div>
    </div>
  )
}