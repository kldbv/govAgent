import { useEffect, useMemo, useState } from 'react'
import { saveApplicationDraft, submitApplicationById } from '@/services/api'
import { BusinessProgram } from '@/types/program'

interface ApplicationWizardProps {
  program: BusinessProgram
  onClose: () => void
}

type Step = 1 | 2 | 3

interface DraftData {
  applicant: {
    company_name: string
    contact_person: string
    phone: string
    email: string
  }
  documents: { [name: string]: boolean }
}

const defaultDraft: DraftData = {
  applicant: {
    company_name: '',
    contact_person: '',
    phone: '',
    email: ''
  },
  documents: {}
}

export function ApplicationWizard({ program, onClose }: ApplicationWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const storageKey = useMemo(() => `app_draft_${program.id}`, [program.id])

  const [draft, setDraft] = useState<DraftData>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    return defaultDraft
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [draft, storageKey])

  const requiredDocs: string[] = program.required_documents || []

  const canNextStep = (): boolean => {
    if (step === 1) {
      const { company_name, contact_person, phone, email } = draft.applicant
      return (
        company_name.trim().length >= 2 &&
        contact_person.trim().length >= 2 &&
        /^(\+?\d[\d\s\-]{7,})$/.test(phone.trim()) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      )
    }
    if (step === 2) {
      if (requiredDocs.length === 0) return true
      // Все обязательные документы отмечены
      return requiredDocs.every((d) => draft.documents[d])
    }
    return true
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')
      // 1) сохраняем черновик
      const draftResp = await saveApplicationDraft(program.id, { applicant: draft.applicant, documents: draft.documents }) as any
      // 2) подаем заявку по ID
      await submitApplicationById(draftResp.data.application_id)
      localStorage.removeItem(storageKey)
      alert('Заявка отправлена!')
      onClose()
    } catch (e: any) {
      setError(e.message || 'Не удалось отправить заявку')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Подача заявки — {program.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span className={`px-2 py-1 rounded ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</span>
            <span>Контакты</span>
            <span className="text-gray-400">→</span>
            <span className={`px-2 py-1 rounded ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</span>
            <span>Документы</span>
            <span className="text-gray-400">→</span>
            <span className={`px-2 py-1 rounded ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</span>
            <span>Проверка и отправка</span>
          </div>
        </div>

        <div className="p-4">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название компании</label>
                <input
                  className="input-field"
                  value={draft.applicant.company_name}
                  onChange={(e) => setDraft({ ...draft, applicant: { ...draft.applicant, company_name: e.target.value } })}
placeholder={'ТОО "Пример"'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Контактное лицо</label>
                <input
                  className="input-field"
                  value={draft.applicant.contact_person}
                  onChange={(e) => setDraft({ ...draft, applicant: { ...draft.applicant, contact_person: e.target.value } })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input
                  className="input-field"
                  value={draft.applicant.phone}
                  onChange={(e) => setDraft({ ...draft, applicant: { ...draft.applicant, phone: e.target.value } })}
                  placeholder="+7 700 000 00 00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={draft.applicant.email}
                  onChange={(e) => setDraft({ ...draft, applicant: { ...draft.applicant, email: e.target.value } })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 className="font-medium mb-2">Необходимые документы</h4>
              {requiredDocs.length === 0 ? (
                <p className="text-sm text-gray-600">Для этой программы список документов не указан. Вы можете продолжить.</p>
              ) : (
                <div className="space-y-2">
                  {requiredDocs.map((doc, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!draft.documents[doc]}
                        onChange={(e) =>
                          setDraft({ ...draft, documents: { ...draft.documents, [doc]: e.target.checked } })
                        }
                      />
                      <span className="text-sm text-gray-800">{doc}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">Загрузка файлов будет добавлена позже. Сейчас отметьте, что документы готовы.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Проверьте данные</h4>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <div><span className="text-gray-500">Компания:</span> {draft.applicant.company_name || '—'}</div>
                  <div><span className="text-gray-500">Контактное лицо:</span> {draft.applicant.contact_person || '—'}</div>
                  <div><span className="text-gray-500">Телефон:</span> {draft.applicant.phone || '—'}</div>
                  <div><span className="text-gray-500">Email:</span> {draft.applicant.email || '—'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Документы</h4>
                <ul className="list-disc list-inside text-sm text-gray-800">
                  {(requiredDocs.length ? requiredDocs : ['Не указано']).map((d, i) => (
                    <li key={i}>{d}{requiredDocs.length ? (draft.documents[d] ? ' — готово' : ' — не отмечено') : ''}</li>
                  ))}
                </ul>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary">Назад</button>
            )}
            {step < 3 && (
              <button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNextStep()} className="btn-primary">
                Далее
              </button>
            )}
            {step === 3 && (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

