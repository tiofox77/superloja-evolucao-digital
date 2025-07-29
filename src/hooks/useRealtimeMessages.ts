import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AIConversation {
  id: string;
  platform: string;
  user_id: string;
  message: string;
  type: 'received' | 'sent';
  timestamp: string;
  metadata: any;
}

interface UseRealtimeMessagesReturn {
  messages: AIConversation[];
  isLoading: boolean;
  lastUpdate: Date | null;
  sendTestMessage: (message: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  messageCount: number;
}

export const useRealtimeMessages = (): UseRealtimeMessagesReturn => {
  const [messages, setMessages] = useState<AIConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const { toast } = useToast();

  // 📡 Buscar mensagens usando SQL direto
  const fetchMessages = useCallback(async () => {
    try {
      console.log('🔍 Buscando mensagens...');
      
      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/rest/v1/rpc/get_recent_conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📝 Mensagens encontradas:', data.length);
      
      // Mapear dados para interface
      const mappedMessages: AIConversation[] = data.map((item: any) => ({
        id: item.id,
        platform: item.platform,
        user_id: item.user_id,
        message: item.message,
        type: item.type,
        timestamp: item.msg_timestamp,
        metadata: item.metadata || {}
      }));

      setMessages(mappedMessages);
      setMessageCount(mappedMessages.length);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      toast({
        title: "Erro ao buscar mensagens",
        description: "Tentando novamente...",
        variant: "destructive"
      });
    }
  }, [toast]);

  // 🔄 Refresh manual das mensagens
  const refreshMessages = useCallback(async () => {
    setIsLoading(true);
    await fetchMessages();
    setIsLoading(false);
  }, [fetchMessages]);

  // 📨 Enviar mensagem de teste
  const sendTestMessage = useCallback(async (message: string) => {
    try {
      console.log('📤 Enviando mensagem de teste:', message);
      
      const testMessage = {
        platform: 'test',
        user_id: `test_user_${Date.now()}`,
        message: message,
        type: 'received',
        metadata: { source: 'realtime_hook_test' }
      };

      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/rest/v1/ai_conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(testMessage)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Mensagem de teste enviada! ✅",
        description: "A mensagem deve aparecer na próxima atualização"
      });

      // Refresh após envio
      setTimeout(() => refreshMessages(), 1000);

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de teste:', error);
      toast({
        title: "Erro ao enviar teste",
        description: "Verifique a conexão",
        variant: "destructive"
      });
    }
  }, [toast, refreshMessages]);

  // 🚀 Inicialização
  useEffect(() => {
    console.log('🚀 Iniciando hook de mensagens em tempo real...');
    refreshMessages();
  }, [refreshMessages]);

  // ⏰ Polling automático a cada 5 segundos
  useEffect(() => {
    console.log('⏰ Configurando polling automático...');
    
    const interval = setInterval(async () => {
      console.log('🔄 Polling automático - verificando mensagens...');
      await fetchMessages();
    }, 5000); // 5 segundos

    return () => {
      console.log('🧹 Limpando polling automático...');
      clearInterval(interval);
    };
  }, [fetchMessages]);

  // 🎯 Detectar novas mensagens
  useEffect(() => {
    if (messages.length > 0 && messageCount > 0 && messageCount !== messages.length) {
      const newMessagesCount = messages.length - messageCount;
      if (newMessagesCount > 0) {
        toast({
          title: `${newMessagesCount} nova(s) mensagem(ns)! 📨`,
          description: "Mensagens atualizadas automaticamente"
        });
      }
      setMessageCount(messages.length);
    }
  }, [messages.length, messageCount, toast]);

  return {
    messages,
    isLoading,
    lastUpdate,
    sendTestMessage,
    refreshMessages,
    messageCount: messages.length
  };
};