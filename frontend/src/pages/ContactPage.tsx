import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, User, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactForm {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  category: 'general' | 'technical' | 'application' | 'partnership'
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.success('Ваше сообщение отправлено! Мы свяжемся с вами в ближайшее время.')
    setForm({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      category: 'general'
    })
    setIsSubmitting(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Телефон горячей линии',
      details: '+7 (727) 244-50-40',
      description: 'Ежедневно с 9:00 до 18:00'
    },
    {
      icon: Mail,
      title: 'Email для обращений',
      details: 'info@businesssupport.kz',
      description: 'Ответ в течение 24 часов'
    },
    {
      icon: MapPin,
      title: 'Офис в Алматы',
      details: 'ул. Достык, 280, офис 402',
      description: 'Прием по предварительной записи'
    },
    {
      icon: Clock,
      title: 'Часы работы',
      details: 'Пн-Пт: 9:00 - 18:00',
      description: 'Сб-Вс: выходные дни'
    }
  ]

  const categories = [
    { value: 'general', label: 'Общие вопросы' },
    { value: 'technical', label: 'Техническая поддержка' },
    { value: 'application', label: 'Подача заявок' },
    { value: 'partnership', label: 'Партнерство' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Свяжитесь с нами</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Мы готовы помочь вам с любыми вопросами о государственной поддержке бизнеса
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Контактная информация</h2>
            
            <div className="space-y-6 mb-8">
              {contactInfo.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-lg text-gray-900 mb-1">{item.details}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FAQ Section */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Часто задаваемые вопросы</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Как долго рассматривается заявка на грант?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Срок рассмотрения заявки составляет от 30 до 45 рабочих дней в зависимости от программы.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Можно ли подать заявку на несколько программ?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Да, вы можете подать заявки на разные программы поддержки, если соответствуете их критериям.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Нужно ли платить за подачу заявки?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Нет, подача заявок на все программы государственной поддержки абсолютно бесплатна.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Отправить сообщение</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <User className="w-4 h-4" />
                      Имя и фамилия *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Введите ваше имя"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <Mail className="w-4 h-4" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    <Phone className="w-4 h-4" />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div>
                  <label className="label">
                    Категория обращения *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Тема сообщения *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Кратко опишите тему вашего обращения"
                  />
                </div>

                <div>
                  <label className="label">
                    <MessageCircle className="w-4 h-4" />
                    Сообщение *
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Подробно опишите ваш вопрос или проблему..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Отправить сообщение
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Success Message */}
            <div className="mt-6 card p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ответим в кратчайшие сроки</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Среднее время ответа на обращения составляет менее 4 часов в рабочие дни
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
