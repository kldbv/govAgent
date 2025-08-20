import { useEffect, useState } from 'react'

export default function AdminMethodologyPage() {
  const [pages, setPages] = useState<any[]>([])
  const [form, setForm] = useState({ slug: 'how-to-apply', title_ru: '', body_ru: '', published: true })
  const [saving, setSaving] = useState(false)
  const base = (import.meta as any).env?.VITE_API_URL || '/api'

  const load = async () => {
    try {
      const res = await fetch(`${base}/methodology`)
      const data = await res.json()
      setPages(data?.data?.pages || [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${base}/methodology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('save failed')
      await load()
      alert('Сохранено')
    } catch (e:any) {
      alert(e.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold mb-6">Методология — админ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Страницы</h2>
          <ul className="space-y-2 text-sm">
            {pages.map((p) => (
              <li key={p.slug} className="flex items-center justify-between">
                <span>{p.slug}</span>
                <span className={`badge ${p.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{p.published ? 'Опубликовано' : 'Черновик'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Создать/обновить</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Заголовок (RU)</label>
              <input className="input-field" value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">HTML (RU)</label>
              <textarea className="input-field h-48" value={form.body_ru} onChange={(e) => setForm({ ...form, body_ru: e.target.value })} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <span>Опубликовано</span>
            </label>
            <div>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

