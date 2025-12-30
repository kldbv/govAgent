import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

export default function HowToApplyPage() {
  const steps = [
    {
      title: 'Определите подходящую программу',
      body: 'Используйте фильтры по ОКЭД, региону, сумме и типу поддержки. Проверьте соответствие требованиям.'
    },
    {
      title: 'Соберите документы',
      body: 'Подготовьте пакет: устав, свидетельство о регистрации, справки об отсутствии задолженностей, бизнес-план и др. Проверьте сроки действия справок.'
    },
    {
      title: 'Заполните заявку',
      body: 'Тщательно заполните все поля. Избегайте ошибок в контактных данных. Указывайте номера документов без опечаток.'
    },
    {
      title: 'Подайте через нужный канал',
      body: 'Онлайн-портал, email или очно — в зависимости от требований программы. Сохраните номер заявки.'
    },
    {
      title: 'Отслеживайте статус и отвечайте на запросы',
      body: 'Проверяйте почту/СМС. При необходимости оперативно предоставляйте дополнительные документы.'
    },
  ]

  const checklist = [
    'Проверены требования программы и целевая аудитория',
    'Готов бизнес-план и финансовые расчеты',
    'Получены свежие справки (налоги, гос. регистрация)',
    'Подписанты и доверенности оформлены',
    'Файлы названы корректно и читаемо (PDF, без паролей)'
  ]

  const [title, setTitle] = useState('Методология и инструкция по оформлению')
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || '/api'
        const res = await fetch(`${base}/methodology/how-to-apply`)
        if (res.ok) {
          const data = await res.json()
          const page = data?.data?.page
          if (page?.title_ru) setTitle(page.title_ru)
          if (page?.body_ru) setHtml(page.body_ru)
        }
      } catch (_) {
        // use static fallback below
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">Универсальные рекомендации по подготовке и подаче заявки на гранты и субсидии.</p>

      {html ? (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
      ) : (
        <>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-semibold">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-gray-700 mt-1">{s.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!html && (
            <div className="card p-6 mt-8">
              <h2 className="text-xl font-semibold mb-3">Чек-лист перед подачей</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {checklist.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="text-sm text-gray-500 mt-6">
        Подробные пошаговые инструкции доступны на странице конкретной программы (кнопка «Подробнее» → «Инструкция по оформлению»).
      </div>
    </div>
  )
}
