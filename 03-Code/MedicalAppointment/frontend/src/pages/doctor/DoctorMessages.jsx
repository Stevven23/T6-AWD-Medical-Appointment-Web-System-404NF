import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { EnvelopeIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function DoctorMessages() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  useEffect(() => {
    // Mock data - reemplazar con llamada a API real
    setMessages([
      {
        id: 1,
        from: 'Sofía Narvaez',
        subject: 'Consulta sobre resultados',
        preview: 'Hola Dr. Mendoza, quería consultar sobre mis resultados...',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unread: true,
        content: 'Hola Dr. Mendoza,\n\nQuería consultar sobre los resultados de mis exámenes. ¿Cuándo podría recibirlos?\n\nGracias,\nSofía',
      },
      {
        id: 2,
        from: 'Juan Martínez',
        subject: 'Pregunta sobre medicación',
        preview: 'Dr., tengo una pregunta sobre la dosis de mi medicación...',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        unread: true,
        content: 'Estimado Dr.,\n\nTengo una pregunta sobre la dosis de mi medicación actual. ¿Puedo aumentarla sin consultar?\n\nGracias',
      },
      {
        id: 3,
        from: 'Ana López',
        subject: 'Solicitud de receta',
        preview: 'Hola Dr., necesito una renovación para mi receta...',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        unread: false,
        content: 'Hola Dr.,\n\nNecesito una renovación para mi receta de control. ¿Es posible que me la envíe?\n\nSaludos',
      },
    ]);
  }, []);

  const filteredMessages = messages.filter(msg =>
    msg.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${Math.floor(hours)}h`;
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 7) return `Hace ${Math.floor(days)}d`;
    return date.toLocaleDateString('es-ES');
  };

  const handleSendReply = () => {
    if (newMessageText.trim()) {
      // Aquí iría la lógica para enviar el mensaje
      setNewMessageText('');
      alert('Mensaje enviado exitosamente');
    }
  };

  const deleteMessage = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
      setMessages(messages.filter(msg => msg.id !== id));
      setSelectedMessage(null);
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Mensajes</h2>
          <button
            onClick={() => setShowNewMessageForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <EnvelopeIcon className="w-5 h-5" />
            Nuevo Mensaje
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar mensajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay mensajes
                </div>
              ) : (
                filteredMessages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                      selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    } ${message.unread ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className={`font-semibold text-gray-800 ${message.unread ? 'font-bold' : ''}`}>
                        {message.from}
                      </h3>
                      {message.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-1"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(message.date)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 flex flex-col">
            {selectedMessage ? (
              <>
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMessage.subject}</h3>
                    <p className="text-gray-600 mt-1">De: {selectedMessage.from}</p>
                    <p className="text-sm text-gray-500">{selectedMessage.date.toLocaleString('es-ES')}</p>
                  </div>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 mb-6">
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Responder</h4>
                  <textarea
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Enviar Respuesta
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Selecciona un mensaje para ver los detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
