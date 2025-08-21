import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Phone } from 'lucide-react'

interface FAQ {
  id: number
  question: string
  answer: string
  category: 'general' | 'applications' | 'programs' | 'technical' | 'payments'
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "Кто может подать заявку на получение государственной поддержки?",
    answer: "Подать заявку могут зарегистрированные индивидуальные предприниматели и юридические лица, осуществляющие предпринимательскую деятельность в Республике Казахстан. Также поддержка доступна для стартапов и малого бизнеса в соответствии с критериями каждой программы.",
    category: "general"
  },
  {
    id: 2,
    question: "Какие документы нужны для подачи заявки?",
    answer: "Базовый пакет документов включает: свидетельство о государственной регистрации, справку о налоговой задолженности, бизнес-план, финансовую отчетность за последний год, копии документов руководителя. Полный список зависит от конкретной программы и указан в ее описании.",
    category: "applications"
  },
  {
    id: 3,
    question: "Сколько времени занимает рассмотрение заявки?",
    answer: "Срок рассмотрения заявки составляет от 30 до 45 рабочих дней в зависимости от программы и сложности проекта. В случае необходимости дополнительной экспертизы срок может быть продлен до 60 дней с уведомлением заявителя.",
    category: "applications"
  },
  {
    id: 4,
    question: "Можно ли подать заявку на несколько программ одновременно?",
    answer: "Да, вы можете подать заявки на разные программы поддержки одновременно, если ваш бизнес соответствует критериям этих программ. Однако получить поддержку по одному проекту можно только в рамках одной программы.",
    category: "programs"
  },
  {
    id: 5,
    question: "Нужно ли платить за подачу заявки или рассмотрение?",
    answer: "Нет, подача заявок на все программы государственной поддержки бизнеса абсолютно бесплатна. Любые требования об оплате являются мошенничеством - сообщите о таких случаях на горячую линию.",
    category: "payments"
  },
  {
    id: 6,
    question: "Что делать, если заявка была отклонена?",
    answer: "В случае отклонения заявки вы получите подробное обоснование решения с указанием причин. Вы можете устранить недостатки и подать заявку повторно в следующем периоде приема заявок или обратиться за консультацией к специалистам поддержки.",
    category: "applications"
  },
  {
    id: 7,
    question: "Какие виды поддержки доступны для стартапов?",
    answer: "Для стартапов доступны гранты на развитие инновационных проектов, субсидирование процентных ставок по кредитам, налоговые льготы, бесплатные консультации и обучение, а также возможность участия в акселерационных программах.",
    category: "programs"
  },
  {
    id: 8,
    question: "Как узнать статус рассмотрения моей заявки?",
    answer: "Статус заявки можно отследить в личном кабинете на платформе. Также вы будете получать уведомления на email при изменении статуса. Дополнительно можно обратиться в службу поддержки по телефону горячей линии.",
    category: "technical"
  },
  {
    id: 9,
    question: "Какие требования к бизнес-плану?",
    answer: "Бизнес-план должен содержать: описание бизнеса и продукта/услуги, анализ рынка и конкурентов, маркетинговую стратегию, операционный план, финансовые прогнозы на 3-5 лет, информацию о команде проекта. Объем - от 15 до 30 страниц.",
    category: "applications"
  },
  {
    id: 10,
    question: "Есть ли ограничения по сумме запрашиваемой поддержки?",
    answer: "Да, каждая программа имеет свои лимиты. Гранты для стартапов: до 3 млн тенге, для малого бизнеса: до 10 млн тенге, для среднего бизнеса: до 50 млн тенге. Субсидирование кредитов может покрывать до 70% от суммы кредита.",
    category: "programs"
  }
]

const categories = [
  { id: 'all', name: 'Все вопросы', count: faqs.length },
  { id: 'general', name: 'Общие вопросы', count: faqs.filter(f => f.category === 'general').length },
  { id: 'applications', name: 'Подача заявок', count: faqs.filter(f => f.category === 'applications').length },
  { id: 'programs', name: 'Программы поддержки', count: faqs.filter(f => f.category === 'programs').length },
  { id: 'technical', name: 'Техническая поддержка', count: faqs.filter(f => f.category === 'technical').length },
  { id: 'payments', name: 'Оплата и финансы', count: faqs.filter(f => f.category === 'payments').length }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<number[]>([])

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HelpCircle className="mx-auto h-16 w-16 text-primary-200 mb-4" />
            <h1 className="text-4xl font-bold mb-4">Вопросы и ответы</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Ответы на самые популярные вопросы о государственной поддержке бизнеса
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Категории</h3>
              <nav className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Contact Support */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Не нашли ответ?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Свяжитесь с нашей службой поддержки
                </p>
                <div className="space-y-2">
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <Phone className="w-4 h-4" />
                    +7 (727) 244-50-40
                  </button>
                  <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    <MessageCircle className="w-4 h-4" />
                    Написать сообщение
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по вопросам и ответам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  Найдено {filteredFAQs.length} результатов для "{searchQuery}"
                </p>
              )}
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {filteredFAQs.map(faq => {
                const isOpen = openItems.includes(faq.id)
                return (
                  <div key={faq.id} className="card overflow-hidden">
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 pr-4">
                          {faq.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Вопросы не найдены
                </h3>
                <p className="text-gray-500 mb-4">
                  Попробуйте изменить критерии поиска или выбрать другую категорию
                </p>
                <button className="btn-primary">
                  Задать вопрос службе поддержки
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
