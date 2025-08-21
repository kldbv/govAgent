import { useEffect } from 'react'
import { X, Play } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
  title?: string
}

export function VideoModal({ isOpen, onClose, videoUrl, title = "Как это работает" }: VideoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Демо видео URL (можно заменить на реальное видео)
  const defaultVideoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Video Content */}
        <div className="p-6">
          <div className="aspect-w-16 aspect-h-9 mb-4">
            <iframe
              src={videoUrl || defaultVideoUrl}
              className="w-full h-96 rounded-lg"
              allowFullScreen
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          {/* Video Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Пошаговое руководство по использованию платформы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">В этом видео вы узнаете:</h4>
                <ul className="space-y-1">
                  <li>• Как зарегистрироваться в системе</li>
                  <li>• Как найти подходящие программы</li>
                  <li>• Как подать заявку на поддержку</li>
                  <li>• Как отслеживать статус заявки</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Дополнительные возможности:</h4>
                <ul className="space-y-1">
                  <li>• Персональные рекомендации</li>
                  <li>• Консультации с экспертами</li>
                  <li>• Шаблоны документов</li>
                  <li>• Онлайн-поддержка 24/7</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Продолжительность: 3 минуты 45 секунд
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Закрыть
              </button>
              <button className="btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" />
                Начать работу
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
