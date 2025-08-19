import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Phone, 
  Mail,
  Calendar,
  Target,
  Users,
  DollarSign,
  PlayCircle,
  PauseCircle,
  XCircle,
  Send
} from 'lucide-react';

interface ApplicationStep {
  step_number: number;
  title: string;
  description: string;
  required_documents: string[];
  estimated_duration: string;
  deadline?: string;
  responsible_contact?: {
    name?: string;
    phone?: string;
    email?: string;
    department?: string;
  };
  instructions: string[];
  tips: string[];
  common_errors: string[];
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies?: number[];
}

interface ApplicationInstructions {
  program_id: number;
  program_title: string;
  organization: string;
  application_deadline: string;
  total_estimated_time: string;
  overview: string;
  prerequisites: string[];
  steps: ApplicationStep[];
  final_submission: {
    method: string;
    submission_address?: string;
    submission_email?: string;
    submission_portal?: string;
    required_format: string[];
  };
  follow_up: {
    review_time: string;
    notification_method: string;
    contact_for_questions: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };
  success_metrics: {
    approval_rate: string;
    average_funding_amount: string;
    typical_processing_time: string;
  };
}

interface StepProgress {
  step_number: number;
  status: string;
  notes?: string;
  updated_at: Date;
}

export const InstructionsPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const [instructions, setInstructions] = useState<ApplicationInstructions | null>(null);
  const [progress, setProgress] = useState<StepProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [updatingStep, setUpdatingStep] = useState<number | null>(null);

  useEffect(() => {
    if (programId) {
      fetchInstructions();
    }
  }, [programId]);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs/${programId}/instructions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch instructions');
      }

      const data = await response.json();
      setInstructions(data.data.instructions);
      setProgress(data.data.progress || []);
    } catch (error) {
      console.error('Error fetching instructions:', error);
      setError('Не удалось загрузить инструкции. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = async (
    stepNumber: number, 
    status: 'pending' | 'in_progress' | 'completed' | 'blocked',
    notes?: string
  ) => {
    try {
      setUpdatingStep(stepNumber);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/programs/${programId}/instructions/step-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_number: stepNumber,
            status,
            notes
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update step status');
      }

      // Update local progress
      setProgress(prev => {
        const existing = prev.find(p => p.step_number === stepNumber);
        if (existing) {
          return prev.map(p => 
            p.step_number === stepNumber 
              ? { ...p, status, notes, updated_at: new Date() }
              : p
          );
        } else {
          return [...prev, {
            step_number: stepNumber,
            status,
            notes,
            updated_at: new Date()
          }];
        }
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      alert('Не удалось обновить статус шага. Попробуйте еще раз.');
    } finally {
      setUpdatingStep(null);
    }
  };

  const getStepStatus = (stepNumber: number): string => {
    const stepProgress = progress.find(p => p.step_number === stepNumber);
    return stepProgress?.status || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'in_progress':
        return <PlayCircle className="text-blue-500" size={20} />;
      case 'blocked':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <PauseCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'blocked':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const calculateProgress = (): number => {
    if (!instructions) return 0;
    const totalSteps = instructions.steps.length;
    const completedSteps = progress.filter(p => p.status === 'completed').length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-3/4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 mb-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchInstructions}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Попробовать еще раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!instructions) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">Инструкции не найдены</p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Инструкция по подаче заявки
              </h1>
              <h2 className="text-lg text-blue-600 mb-1">
                {instructions.program_title}
              </h2>
              <p className="text-gray-600">{instructions.organization}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {progressPercentage}%
              </div>
              <div className="text-sm text-gray-500">выполнено</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Calendar className="mr-2" size={16} />
              <span>Крайний срок: {instructions.application_deadline}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="mr-2" size={16} />
              <span>Время: {instructions.total_estimated_time}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Target className="mr-2" size={16} />
              <span>Этапов: {instructions.steps.length}</span>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Обзор процесса</h3>
          <p className="text-gray-700 mb-4">{instructions.overview}</p>
          
          {instructions.prerequisites.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Необходимые условия:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {instructions.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {instructions.steps.map((step) => {
            const status = getStepStatus(step.step_number);
            const isExpanded = expandedStep === step.step_number;
            const isUpdating = updatingStep === step.step_number;

            return (
              <div
                key={step.step_number}
                className={`bg-white rounded-lg shadow-sm border-2 ${getStatusColor(status)}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                            Шаг {step.step_number}
                          </span>
                          <span className="text-sm text-gray-500">
                            {step.estimated_duration}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-700">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {isExpanded ? 'Свернуть' : 'Подробнее'}
                      </button>
                    </div>
                  </div>

                  {/* Step Actions */}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() => updateStepStatus(step.step_number, 'in_progress')}
                      disabled={isUpdating || status === 'in_progress'}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        status === 'in_progress' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
                      }`}
                    >
                      Начать
                    </button>
                    <button
                      onClick={() => updateStepStatus(step.step_number, 'completed')}
                      disabled={isUpdating || status === 'completed'}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700'
                      }`}
                    >
                      Завершить
                    </button>
                    {status !== 'pending' && (
                      <button
                        onClick={() => updateStepStatus(step.step_number, 'pending')}
                        disabled={isUpdating}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Required Documents */}
                      {step.required_documents.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <FileText className="mr-2" size={16} />
                            Необходимые документы:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {step.required_documents.map((doc, i) => (
                              <li key={i}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Instructions */}
                      {step.instructions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Пошаговые действия:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700">
                            {step.instructions.map((instruction, i) => (
                              <li key={i}>{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Tips */}
                      {step.tips.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-800">💡 Полезные советы:</h4>
                          <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                            {step.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Common Errors */}
                      {step.common_errors.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <h4 className="font-medium mb-2 text-red-800">⚠️ Частые ошибки:</h4>
                          <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                            {step.common_errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contact Info */}
                      {step.responsible_contact && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium mb-2">Контакты для вопросов:</h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            {step.responsible_contact.name && (
                              <div className="flex items-center">
                                <Users className="mr-2" size={14} />
                                {step.responsible_contact.name}
                                {step.responsible_contact.department && (
                                  <span className="text-gray-500 ml-1">
                                    ({step.responsible_contact.department})
                                  </span>
                                )}
                              </div>
                            )}
                            {step.responsible_contact.phone && (
                              <div className="flex items-center">
                                <Phone className="mr-2" size={14} />
                                {step.responsible_contact.phone}
                              </div>
                            )}
                            {step.responsible_contact.email && (
                              <div className="flex items-center">
                                <Mail className="mr-2" size={14} />
                                {step.responsible_contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Submission & Follow-up */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Send className="mr-2" size={20} />
              Подача заявки
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Способ подачи:</span> {instructions.final_submission.method}
              </div>
              {instructions.final_submission.submission_portal && (
                <div>
                  <span className="font-medium">Портал:</span> {instructions.final_submission.submission_portal}
                </div>
              )}
              <div>
                <span className="font-medium">Формат:</span>
                <ul className="list-disc list-inside mt-1 ml-4">
                  {instructions.final_submission.required_format.map((format, i) => (
                    <li key={i}>{format}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Отслеживание заявки
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Время рассмотрения:</span> {instructions.follow_up.review_time}
              </div>
              <div>
                <span className="font-medium">Уведомления:</span> {instructions.follow_up.notification_method}
              </div>
              {instructions.follow_up.contact_for_questions.phone && (
                <div className="flex items-center">
                  <Phone className="mr-2" size={14} />
                  {instructions.follow_up.contact_for_questions.phone}
                </div>
              )}
              {instructions.follow_up.contact_for_questions.email && (
                <div className="flex items-center">
                  <Mail className="mr-2" size={14} />
                  {instructions.follow_up.contact_for_questions.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="mr-2" size={20} />
            Статистика программы
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {instructions.success_metrics.approval_rate}
              </div>
              <div className="text-gray-600">Процент одобрения</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {instructions.success_metrics.average_funding_amount}
              </div>
              <div className="text-gray-600">Средняя сумма</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {instructions.success_metrics.typical_processing_time}
              </div>
              <div className="text-gray-600">Время обработки</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
