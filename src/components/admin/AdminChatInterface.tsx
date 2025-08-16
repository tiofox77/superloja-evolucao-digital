import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  MapPin, 
  User, 
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  type: 'user' | 'assistant' | 'admin';
  platform: string;
  timestamp: string;
  metadata?: any;
}

interface CustomerData {
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_location?: string;
  platform: string;
  notification_id?: string;
}

interface AdminChatInterfaceProps {
  customerData: CustomerData;
  onClose?: () => void;
}

const AdminChatInterface = ({ customerData, onClose }: AdminChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Carregar conversa do cliente
  const loadConversation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', customerData.customer_id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast.error('Erro ao carregar conversa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    
    // Polling para novas mensagens a cada 5 segundos
    const interval = setInterval(loadConversation, 5000);
    return () => clearInterval(interval);
  }, [customerData.customer_id]);

  // Enviar resposta do admin
  const sendAdminResponse = async () => {
    if (!adminMessage.trim()) return;

    setSending(true);
    try {
      const response = await supabase.functions.invoke('admin-chat-response', {
        body: {
          customer_id: customerData.customer_id,
          admin_message: adminMessage.trim(),
          platform: customerData.platform,
          notification_id: customerData.notification_id
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Resposta enviada com sucesso!');
      setAdminMessage('');
      
      // Recarregar conversa
      setTimeout(loadConversation, 1000);

    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  // Formattar data
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Obter cor do tipo de mensagem
  const getMessageColor = (type: string) => {
    switch (type) {
      case 'admin': return 'bg-blue-100 border-blue-200';
      case 'user': return 'bg-gray-100 border-gray-200';
      case 'assistant': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <Card className="h-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat com Cliente
            </CardTitle>
            <CardDescription>
              Conversa direta com o cliente - as mensagens são enviadas automaticamente
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações do Cliente */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{customerData.customer_name || customerData.customer_id}</span>
              </div>
              {customerData.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{customerData.customer_phone}</span>
                </div>
              )}
              {customerData.customer_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{customerData.customer_location}</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <Badge variant="outline">
                📱 {customerData.platform}
              </Badge>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="border rounded-lg">
            <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
              <span className="font-medium">Conversa</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadConversation}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <ScrollArea className="h-96 p-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p>Carregando conversa...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border ${getMessageColor(message.type)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {message.type === 'admin' ? '👨‍💼 Admin' : 
                           message.type === 'user' ? '👤 Cliente' : 
                           '🤖 IA'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      {message.metadata?.sent_by_admin && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Enviado como Admin
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Área de Resposta */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sua Resposta (será enviada diretamente ao cliente):
              </label>
              <Textarea
                placeholder="Digite sua resposta para o cliente..."
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                className="min-h-20"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    sendAdminResponse();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pressione Ctrl+Enter para enviar rapidamente
              </p>
            </div>
            <Button 
              onClick={sendAdminResponse}
              disabled={!adminMessage.trim() || sending}
              className="w-full"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <h4 className="font-medium mb-1">ℹ️ Como funciona:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Para Facebook/Instagram: mensagem enviada diretamente ao cliente</li>
              <li>Para Website: resposta fica disponível quando cliente abrir o chat</li>
              <li>A conversa é atualizada automaticamente a cada 5 segundos</li>
              <li>Todas as mensagens ficam registradas no histórico</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminChatInterface;