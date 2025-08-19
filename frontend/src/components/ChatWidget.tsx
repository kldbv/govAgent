import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader, Lightbulb } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  suggested_actions?: string[];
}

interface ChatWidgetProps {
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  isAuthenticated, 
  onAuthRequired 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSuggestions();
    }
  }, [isOpen, isAuthenticated]);

  const loadSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSendMessage = async (message: string = inputMessage) => {
    if (!message.trim()) return;
    
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message,
          include_history: true 
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.data.message,
          isUser: false,
          timestamp: new Date(),
          intent: data.data.intent,
          confidence: data.data.confidence,
          suggested_actions: data.data.suggested_actions
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0 && isAuthenticated) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: 'Добро пожаловать! Я помогу вам найти подходящие программы поддержки бизнеса. Расскажите о вашем бизнесе или задайте вопрос.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center">
            <Bot className="mr-2" size={20} />
            <div>
              <h3 className="font-semibold">AI Помощник</h3>
              <p className="text-sm opacity-90">Поддержка бизнеса</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {!isAuthenticated ? (
              <div className="text-center p-6">
                <Bot className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-gray-600 mb-4">
                  Войдите в систему, чтобы начать чат с AI помощником
                </p>
                <button
                  onClick={onAuthRequired}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Войти
                </button>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {!message.isUser && <Bot size={16} className="mt-1 flex-shrink-0 text-blue-600" />}
                        {message.isUser && <User size={16} className="mt-1 flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          {message.suggested_actions && message.suggested_actions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.suggested_actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSendMessage(action)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-1 mb-1 hover:bg-blue-200 transition-colors"
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          )}
                          {message.confidence && (
                            <div className="text-xs opacity-70 mt-1">
                              Уверенность: {Math.round(message.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot size={16} className="text-blue-600" />
                        <Loader className="animate-spin" size={16} />
                        <span className="text-sm text-gray-600">Думаю...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Suggestions */}
                {suggestions.length > 0 && messages.length <= 1 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center mb-2">
                      <Lightbulb size={16} className="text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Быстрые вопросы:</span>
                    </div>
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(suggestion)}
                          className="w-full text-left text-sm bg-blue-50 text-blue-700 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваш вопрос..."
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
