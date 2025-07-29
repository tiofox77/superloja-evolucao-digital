import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  isConnected: boolean;
  sendTestMessage: (message: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export const useRealtimeMessages = (): UseRealtimeMessagesReturn => {
  const [messages, setMessages] = useState<AIConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // 📡 Carregar mensagens iniciais
  const loadInitialMessages = useCallback(async () => {
    try {
      console.log('🔍 Carregando mensagens iniciais...');
      setIsLoading(true);
      
      // Usar query SQL direta já que ai_conversations não está nos tipos
      const { data, error } = await supabase.rpc('get_recent_conversations', {});

      if (error) {
        console.error('❌ Erro ao carregar mensagens - tentando query direta:', error);
        // Fallback para query SQL direta
        const { data: directData, error: directError } = await supabase
          .from('ai_conversations' as any)
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (directError) {
          console.error('❌ Erro na query direta:', directError);
          toast({
            title: "Erro ao carregar mensagens",
            description: directError.message,
            variant: "destructive"
          });
          return;
        }

        console.log('📝 Mensagens carregadas (query direta):', directData?.length || 0);
        setMessages(directData || []);
        return;
      }

      console.log('📝 Mensagens carregadas:', data?.length || 0);
      setMessages(data || []);
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 🔄 Refresh manual das mensagens
  const refreshMessages = useCallback(async () => {
    await loadInitialMessages();
  }, [loadInitialMessages]);

  // 📨 Enviar mensagem de teste
  const sendTestMessage = useCallback(async (message: string) => {
    try {
      console.log('📤 Enviando mensagem de teste:', message);
      
      const testMessage = {
        platform: 'test',
        user_id: `test_user_${Date.now()}`,
        message: message,
        type: 'received' as const,
        metadata: { source: 'test_hook' }
      };

      const { error } = await supabase
        .from('ai_conversations')
        .insert([testMessage]);

      if (error) {
        console.error('❌ Erro ao enviar mensagem de teste:', error);
        toast({
          title: "Erro ao enviar mensagem",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Mensagem de teste enviada! ✅",
        description: "A mensagem deve aparecer na lista em tempo real"
      });

    } catch (error) {
      console.error('❌ Erro inesperado ao enviar teste:', error);
    }
  }, [toast]);

  // ✅ Marcar mensagem como lida
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      console.log('📖 Marcando mensagem como lida:', messageId);
      
      // Atualizar localmente primeiro para responsividade
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, metadata: { ...msg.metadata, read: true } }
          : msg
      ));

      const { error } = await supabase
        .from('ai_conversations')
        .update({ metadata: { read: true } })
        .eq('id', messageId);

      if (error) {
        console.error('❌ Erro ao marcar como lida:', error);
        // Reverter mudança local em caso de erro
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, metadata: { ...msg.metadata, read: false } }
            : msg
        ));
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao marcar como lida:', error);
    }
  }, []);

  // 🎧 Configurar Supabase Realtime
  useEffect(() => {
    console.log('🎧 Configurando Supabase Realtime...');

    // Carregar mensagens iniciais
    loadInitialMessages();

    // Configurar subscription do Realtime
    const channel = supabase
      .channel('ai_conversations_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ai_conversations'
        },
        (payload) => {
          console.log('🔔 Mudança detectada na tabela ai_conversations:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as AIConversation;
            console.log('📨 Nova mensagem recebida:', newMessage);
            
            setMessages(prev => [newMessage, ...prev]);
            
            // Notificação para mensagens recebidas (não enviadas)
            if (newMessage.type === 'received') {
              toast({
                title: `Nova mensagem - ${newMessage.platform}`,
                description: `${newMessage.user_id}: ${newMessage.message.substring(0, 50)}...`,
              });
            }
          }
          
          else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as AIConversation;
            console.log('📝 Mensagem atualizada:', updatedMessage);
            
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          }
          
          else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('🗑️ Mensagem deletada:', deletedId);
            
            setMessages(prev => prev.filter(msg => msg.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão Realtime:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Conectado ao tempo real! 🔴",
            description: "Você receberá mensagens instantaneamente"
          });
        } else if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Erro na conexão",
            description: "Problema ao conectar com tempo real",
            variant: "destructive"
          });
        }
      });

    // Cleanup na desmontagem
    return () => {
      console.log('🧹 Limpando subscription do Realtime...');
      supabase.removeChannel(channel);
    };
  }, [loadInitialMessages, toast]);

  // 🔄 Polling de fallback (caso o Realtime falhe)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isConnected) {
        console.log('🔄 Polling de fallback - Realtime desconectado');
        await refreshMessages();
      }
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [isConnected, refreshMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    sendTestMessage,
    markAsRead,
    refreshMessages
  };
};