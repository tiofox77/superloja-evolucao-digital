import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  type: 'sent' | 'received';
  timestamp: Date;
}

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export default function ChatWidget({ 
  position = 'bottom-right', 
  primaryColor = '#4F46E5' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gerar ID único para sessão
  useEffect(() => {
    const sessionId = localStorage.getItem('chat_session_id') || 
      `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session_id', sessionId);
    setUserId(sessionId);

    // Mensagem de boas-vindas
    setMessages([{
      id: '1',
      text: '👋 Olá! Sou o assistente da SuperLoja. Como posso ajudá-lo hoje?',
      type: 'received',
      timestamp: new Date()
    }]);
  }, []);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      type: 'sent',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Salvar mensagem do usuário
      await (supabase as any).from('ai_conversations').insert({
        platform: 'website',
        user_id: userId,
        message: inputMessage,
        type: 'received'
      });

      // Chamar agente IA
      const { data, error } = await supabase.functions.invoke('website-chat-ai', {
        body: {
          message: inputMessage,
          userId: userId,
          sessionId: userId
        }
      });

      if (error) throw error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Desculpe, ocorreu um erro. Tente novamente.',
        type: 'received',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);

      // Salvar resposta do bot
      await (supabase as any).from('ai_conversations').insert({
        platform: 'website',
        user_id: userId,
        message: botResponse.text,
        type: 'sent'
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns minutos.',
        type: 'received',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const positionClass = position === 'bottom-right' ? 'right-4' : 'left-4';

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 ${positionClass} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 ${positionClass} z-50`}>
      <div className={`
        bg-white rounded-lg shadow-2xl border 
        ${isMinimized ? 'w-80 h-14' : 'w-80 h-96'}
        transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 rounded-t-lg text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-white text-blue-600 text-xs font-bold">
                SL
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">SuperLoja Assistant</h3>
              <p className="text-xs opacity-90">Online agora</p>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 w-8 h-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto h-72 bg-gray-50">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-xs px-3 py-2 rounded-lg text-sm
                        ${message.type === 'sent' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border'
                        }
                      `}
                    >
                      {message.text}
                      <div className={`
                        text-xs mt-1 opacity-70
                        ${message.type === 'sent' ? 'text-blue-100' : 'text-gray-500'}
                      `}>
                        {message.timestamp.toLocaleTimeString('pt-AO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border px-3 py-2 rounded-lg text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
