/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Settings, HelpCircle, User, Bot, Wifi, WifiOff } from 'lucide-react';
import { safeLocalStorage } from '../database';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return safeLocalStorage.getItem('parque_berduc_webhook') || 'https://httpbin.org/post'; // URL por defecto segura que simula respuestas
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Inicializar chat con la bienvenida obligatoria
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: '¡Hola! Bienvenido al asistente virtual del Parque Enrique Berduc de Paraná. ¿En qué puedo ayudarte hoy? Consultame sobre turnos, reservas, horarios o historia laboral.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Hacer scroll automático
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Disparar envío al webhook configurable
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.text,
          timestamp: new Date().toISOString(),
          sender: "Visitante Parque Berduc",
          parque: "Parque Escolar Deportivo Enrique Berduc"
        })
      });

      let botAnswerText = 'He recibido tu mensaje mediante nuestro canal centralizado de atención. ¡Un administrador lo evaluará a la brevedad!';

      if (response.ok) {
        // httpbin devuelve los datos de body en data o json, si es un receptor inteligente respondemos
        try {
          const respData = await response.json();
          // Heurística en caso de que el webhook devuelva una respuesta directa en formato texto o un campo "reply"
          if (respData.reply) {
            botAnswerText = respData.reply;
          } else if (respData.message) {
            botAnswerText = respData.message;
          }
        } catch {
          // Webhhook responde con código exitoso pero ningún JSON
        }
      }

      // Si no hay respuesta inteligente del webhook, simulamos respuestas automáticas basadas en palabras clave de Paraná
      if (botAnswerText.includes('recibido tu mensaje')) {
        const textLower = userMsg.text.toLowerCase();
        if (textLower.includes('turno') || textLower.includes('reserva')) {
          botAnswerText = "Para reservar un espacio deportivo, dirigite a la sección 'Turneras' en la página principal, seleccioná el deporte de tu interés e ingresá tus datos personales. ¡Recuerde que los turnos ya reservados desaparecen!";
        } else if (textLower.includes('atletismo') || textLower.includes('pista')) {
          botAnswerText = "La emblemática pista de atletismo de 6 carriles está en plena remodelación en este año 2026. Se planea una inauguración espectacular.";
        } else if (textLower.includes('horario') || textLower.includes('domingo') || textLower.includes('sabado')) {
          botAnswerText = "El parque abre para actividades generales de lunes a viernes de 14:00 a 22:00 hs y los sábados de 8:00 a 14:00 hs. Las canchas de pádel abren incluso los domingos en el mismo rango de horario.";
        } else if (textLower.includes('gratuito') || textLower.includes('costo')) {
          botAnswerText = "El ingreso recreativo y escolar al Parque Berduc de Paraná es 100% público, gratuito e integrador para todo Entre Ríos.";
        }
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        text: botAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (error) {
      console.error("Error enviando al webhook", error);
      // Respuesta de fallback local offline
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        text: 'He registrado tu inquietud en la consola local (error de conexión de webhook). ¿Querés que simule resolver tu duda sobre los turnos deportivos o la historia del olímpico Nazareno Sasia?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    safeLocalStorage.setItem('parque_berduc_webhook', webhookUrl);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-84 flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-2xl transition-all sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-emerald-800 px-4 py-3.5 text-white">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 border border-emerald-700">
                  <Bot className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-emerald-800"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Asistente Virtual Berduc</h4>
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                  <span className="text-[10px] text-emerald-100 font-medium">Asistencia 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`rounded-lg p-1.5 transition ${showSettings ? 'bg-emerald-950 text-white' : 'text-emerald-100 hover:bg-emerald-900'}`}
                title="Configurar Webhook"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-emerald-100 hover:bg-emerald-900 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Configuración de Webhook */}
          {showSettings ? (
            <form onSubmit={saveSettings} className="flex flex-col border-b border-gray-100 bg-emerald-50/70 p-4 shrink-0 transition-all text-xs">
              <h5 className="font-bold text-gray-800 flex items-center space-x-1.5 mb-1 text-[11px] uppercase tracking-wider">
                <Settings className="h-3.5 w-3.5 text-emerald-700" />
                <span>Configuración de Webhook</span>
              </h5>
              <p className="text-[10px] text-gray-500 mb-2">
                Conecte este chat a un canal real (Discord, Zapier, n8n, etc.) modificando la URL destino:
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://tu-webhook.ejemplo/api"
                  required
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 font-bold text-white hover:bg-emerald-900"
                >
                  Guardar
                </button>
              </div>
              <button
                type="button"
                onClick={() => setWebhookUrl('https://httpbin.org/post')}
                className="mt-1.5 text-right font-semibold text-emerald-800 text-[10px]"
              >
                Restablecer a Simulación
              </button>
            </form>
          ) : null}

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto space-y-3 bg-gray-50 p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end space-x-2 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  m.sender === 'user' ? 'bg-orange-100 text-orange-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Burbuja de Texto */}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs text-gray-800 shadow-xs leading-relaxed ${
                  m.sender === 'user' 
                    ? 'rounded-br-none bg-orange-600 text-white font-medium' 
                    : 'rounded-bl-none bg-white border border-gray-100'
                }`}>
                  <p>{m.text}</p>
                  <span className={`block text-[9px] text-right mt-1 ${
                    m.sender === 'user' ? 'text-orange-200' : 'text-gray-400'
                  }`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="rounded-2xl rounded-bl-none bg-white px-3.5 py-2.5 text-xs text-gray-500 border border-gray-100 shadow-xs">
                  <span className="flex space-x-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribí tu mensaje acá..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 text-white transition shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante redondo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl hover:bg-orange-700 hover:scale-110 active:scale-95 transition-all duration-200 relative group border-2 border-white"
        id="chatbot-floating-bubble-btn"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 border border-white text-[10px] font-bold text-white">
              1
            </span>
          </>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap transition duration-150 shadow font-semibold">
            ¿Dudas? Chatea con nosotros
          </span>
        )}
      </button>
    </div>
  );
}
