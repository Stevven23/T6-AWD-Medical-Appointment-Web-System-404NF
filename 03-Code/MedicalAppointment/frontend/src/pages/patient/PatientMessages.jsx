import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { messageAPI } from '../../services/api';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function PatientMessages() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getPatientMessages();
      setMessages(response.data);
      if (response.data.length > 0 && !selectedMessage) {
        setSelectedMessage(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await messageAPI.sendReply(selectedMessage.id, {
        content: replyText,
      });
      setReplyText('');
      showNotification('Mensaje enviado exitosamente', 'success');
      loadMessages();
    } catch (error) {
      showNotification('Error al enviar el mensaje', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
            <p className="text-gray-600 mt-1">
              Comunícate con tus médicos y revisa notificaciones importantes
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="p-12 text-center">
              <EnvelopeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay mensajes
              </h3>
              <p className="text-gray-600">
                Aún no tienes mensajes de tus médicos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
              <div className="lg:col-span-1 border-r border-gray-200 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <UserCircleIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {message.sender_name}
                          </h4>
                          {!message.read && (
                            <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {formatDateTime(message.date)}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {message.subject}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 flex flex-col">
                {selectedMessage ? (
                  <>
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-600 p-3 rounded-full">
                          <UserCircleIcon className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedMessage.sender_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedMessage.sender_specialty}
                          </p>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mt-4">
                        {selectedMessage.subject}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        {formatDateTime(selectedMessage.date)}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedMessage.content}
                        </p>
                      </div>

                      {selectedMessage.replies &&
                        selectedMessage.replies.length > 0 && (
                          <div className="mt-6 space-y-4">
                            <h4 className="font-semibold text-gray-900">
                              Respuestas
                            </h4>
                            {selectedMessage.replies.map((reply, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-gray-900">
                                    {reply.sender_name}
                                  </p>
                                  <span className="text-sm text-gray-600">
                                    {formatDateTime(reply.date)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    <form
                      onSubmit={handleSendReply}
                      className="p-6 border-t border-gray-200 bg-gray-50"
                    >
                      <div className="flex gap-4">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          rows="3"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                        >
                          <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    Selecciona un mensaje para leer
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
