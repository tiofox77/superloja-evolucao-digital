import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Zap,
  Bot,
  Brain,
  Settings,
  Send,
  Activity,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos para as interfaces
interface Metrics {
  totalMessages: number;
  uniqueUsers: number;
  averageRating: number;
  successfulInteractions: number;
  leadsGenerated: number;
}

interface RealtimeMessage {
  id: string;
  platform: string;
  user_id: string;
  message: string;
  type: 'received' | 'sent';
  timestamp: string;
}

interface Conversation {
  user_id: string;
  userName?: string;
  userContact?: string;
  userAddress?: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  conversationStage?: string;
  selectedProduct?: string;
  isLead?: boolean;
}

interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
  created_at: string;
}

const AdminAgentIA = () => {
  // Estados principais
  const [metrics, setMetrics] = useState<Metrics>({
    totalMessages: 0,
    uniqueUsers: 0,
    averageRating: 0,
    successfulInteractions: 0,
    leadsGenerated: 0
  });

  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  
  // Estados de controle
  const [botEnabled, setBotEnabled] = useState(true);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [conversationMessages, setConversationMessages] = useState<Record<string, any[]>>({});

  // Carregar dados iniciais
  useEffect(() => {
    loadMetrics();
    loadRealtimeMessages();
    loadConversations();
    loadKnowledgeBase();
    loadBotSettings();
    
    // Configurar polling para mensagens em tempo real
    const interval = setInterval(() => {
      loadRealtimeMessages();
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Funções de carregamento de dados
  const loadMetrics = async () => {
    try {
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('*');
      
      if (conversations) {
        const uniqueUsers = new Set(conversations.map(c => c.user_id)).size;
        const receivedMessages = conversations.filter(c => c.type === 'received');
        const sentMessages = conversations.filter(c => c.type === 'sent');
        
        setMetrics({
          totalMessages: conversations.length,
          uniqueUsers,
          averageRating: 85, // Simulado
          successfulInteractions: sentMessages.length,
          leadsGenerated: Math.floor(uniqueUsers * 0.3) // Simulado
        });
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const loadRealtimeMessages = async () => {
    setRealtimeLoading(true);
    try {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (data) {
        const typedMessages = data.filter(msg => 
          msg.type === 'received' || msg.type === 'sent'
        ).map(msg => ({
          ...msg,
          type: msg.type as 'received' | 'sent'
        }));
        
        setRealtimeMessages(typedMessages);
        setMessageCount(typedMessages.length);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setRealtimeLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      // Buscar conversas com informações completas
      const { data: contextData } = await supabase
        .from('ai_conversation_context')
        .select('*')
        .order('last_interaction', { ascending: false });
      
      const { data: conversationData } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (contextData && conversationData) {
        // Mesclar dados de contexto com conversas
        const enrichedConversations = contextData.map(context => {
          const userMessages = conversationData.filter(msg => 
            msg.user_id === context.user_id && msg.platform === context.platform
          );
          
          const lastMessage = userMessages[0]?.message || 'Sem mensagens';
          const userPrefs = context.user_preferences as any;
          const userName = userPrefs?.name || context.user_id;
          const userContact = userPrefs?.contact || '';
          const userAddress = userPrefs?.address || '';
          
          return {
            user_id: context.user_id,
            userName,
            userContact,
            userAddress,
            platform: context.platform,
            lastMessage,
            timestamp: context.last_interaction,
            messageCount: context.message_count || 0,
            conversationStage: (context.context_data as any)?.conversationStage || 'indefinido',
            selectedProduct: (context.context_data as any)?.selectedProduct || '',
            isLead: (context.context_data as any)?.conversationStage === 'confirmed_purchase' || 
                   (context.context_data as any)?.conversationStage === 'finalization' ||
                   (context.context_data as any)?.conversationStage === 'strong_interest'
          };
        });
        
        setConversations(enrichedConversations);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const { data } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('priority', { ascending: false });
      
      if (data) {
        setKnowledgeBase(data);
      }
    } catch (error) {
      console.error('Erro ao carregar base de conhecimento:', error);
    }
  };

  const loadBotSettings = async () => {
    try {
      const { data } = await supabase
        .from('ai_settings')
        .select('key, value')
        .eq('key', 'bot_enabled')
        .single();
      
      if (data) {
        setBotEnabled(data.value === 'true');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do bot:', error);
    }
  };

  // Funções de manipulação
  const handleBotToggle = async (enabled: boolean) => {
    setBotEnabled(enabled);
    
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({ 
          key: 'bot_enabled', 
          value: enabled.toString(),
          description: 'Bot habilitado/desabilitado'
        }, { 
          onConflict: 'key' 
        });
      
      if (error) throw error;
      
      toast.success(enabled ? 'Bot habilitado!' : 'Bot desabilitado!');
    } catch (error) {
      console.error('Erro ao alterar status do bot:', error);
      toast.error('Erro ao salvar configuração');
      setBotEnabled(!enabled); // Reverter
    }
  };

  const testAdminNotification = async () => {
    try {
      toast.info('🧪 Iniciando teste de notificação...');
      
      const { data, error } = await supabase.functions.invoke('test-admin-notification', {
        body: {
          customerMessage: 'sim podem entregar - carlos raposo, 939729902, kilamba j4',
          customerId: '24279509458374902',
          adminId: 'carlosfox2'
        }
      });

      if (error) {
        toast.error(`Erro na função: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success(`✅ ${data.diagnosis}`);
      } else {
        toast.error(`❌ ${data?.diagnosis || 'Teste falhou'}`);
      }
      
    } catch (error) {
      console.error('❌ Erro no teste de notificação:', error);
      toast.error('Erro ao executar teste de notificação');
    }
  };

  const handleKnowledgeBaseToggle = async (enabled: boolean) => {
    setKnowledgeBaseEnabled(enabled);
    
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({ 
          key: 'knowledge_base_enabled', 
          value: enabled.toString(),
          description: 'Base de conhecimento habilitada/desabilitada'
        });
      
      if (error) throw error;
      
      toast.success(enabled ? 'Base de conhecimento ativada!' : 'Base de conhecimento desativada!');
    } catch (error) {
      console.error('Erro ao alterar base de conhecimento:', error);
      toast.error('Erro ao salvar configuração');
      setKnowledgeBaseEnabled(!enabled); // Reverter
    }
  };

  const sendTestMessage = async (message: string) => {
    try {
      const newMessage = {
        id: Date.now().toString(),
        platform: 'test',
        user_id: 'admin_test',
        message,
        type: 'sent' as const,
        timestamp: new Date().toISOString()
      };
      
      setRealtimeMessages(prev => [newMessage, ...prev]);
      toast.success('Mensagem de teste enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const toggleConversation = async (userId: string, platform: string) => {
    const key = `${userId}-${platform}`;
    const newExpanded = new Set(expandedConversations);
    
    if (expandedConversations.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // Carregar mensagens se ainda não foram carregadas
      if (!conversationMessages[key]) {
        await loadConversationMessages(userId, platform, key);
      }
    }
    
    setExpandedConversations(newExpanded);
  };

  const loadConversationMessages = async (userId: string, platform: string, key: string) => {
    try {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .order('timestamp', { ascending: true });
      
      if (data) {
        setConversationMessages(prev => ({
          ...prev,
          [key]: data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Agente IA SuperLoja - 100% IA
          </h1>
          <p className="text-muted-foreground">
            Sistema inteligente com conhecimento completo de produtos e aprendizado automático
          </p>
        </div>
        <Button 
          onClick={loadMetrics}
          variant="default"
          className="bg-orange-500 hover:bg-orange-600"
        >
          Atualizar
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageRating}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações OK</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successfulInteractions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadsGenerated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tempo Real
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Conhecimento
          </TabsTrigger>
        </TabsList>

        {/* Conversas Organizadas */}
        <TabsContent value="conversations">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  💬 Conversas por Usuário
                </CardTitle>
                <CardDescription>
                  Visualize todas as conversas organizadas por usuário com histórico completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma conversa encontrada.</p>
                    </div>
                  ) : (
                    conversations.map((conv, index) => {
                      const key = `${conv.user_id}-${conv.platform}`;
                      const isExpanded = expandedConversations.has(key);
                      const messages = conversationMessages[key] || [];

                      return (
                        <div key={`${key}-${index}`} 
                             className={`border rounded-lg ${conv.isLead ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                          {/* Header da conversa */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleConversation(conv.user_id, conv.platform)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                  conv.isLead ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                                  'bg-gradient-to-br from-blue-500 to-purple-600'
                                }`}>
                                  {conv.userName ? conv.userName.slice(0, 2).toUpperCase() : conv.user_id.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium flex items-center gap-2">
                                    {conv.userName || conv.user_id}
                                    {conv.isLead && <Badge variant="destructive" className="text-xs">🔥 LEAD</Badge>}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {conv.platform}
                                    </Badge>
                                    <Badge variant={conv.isLead ? 'default' : 'secondary'} className="text-xs">
                                      {conv.conversationStage || 'indefinido'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {conv.messageCount} mensagens
                                    </span>
                                  </div>
                                  
                                  {/* Informações do usuário */}
                                  <div className="mt-2 space-y-1">
                                    {conv.userContact && (
                                      <div className="text-xs text-green-600 font-medium">
                                        📞 {conv.userContact}
                                      </div>
                                    )}
                                    {conv.userAddress && (
                                      <div className="text-xs text-blue-600">
                                        📍 {conv.userAddress}
                                      </div>
                                    )}
                                    {conv.selectedProduct && (
                                      <div className="text-xs text-orange-600 font-medium">
                                        🛍️ {conv.selectedProduct}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground text-right">
                                  {new Date(conv.timestamp).toLocaleString('pt-BR')}
                                </div>
                                <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                  ⬇️
                                </div>
                              </div>
                            </div>
                            
                            {/* Última mensagem */}
                            <div className="mt-3 text-sm bg-white p-2 rounded border-l-4 border-gray-300">
                              <span className="font-medium">Última mensagem:</span> {conv.lastMessage}
                            </div>
                          </div>

                          {/* Mensagens expandidas */}
                          {isExpanded && (
                            <div className="border-t bg-gray-50 p-4">
                              <h5 className="font-medium mb-3 text-sm">📝 Histórico da Conversa:</h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {messages.length === 0 ? (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    Carregando mensagens...
                                  </div>
                                ) : (
                                  messages.map((msg, msgIndex) => (
                                    <div key={`${msg.id}-${msgIndex}`} 
                                         className={`p-2 rounded text-sm ${
                                           msg.type === 'received' 
                                             ? 'bg-blue-100 border-l-4 border-blue-500' 
                                             : 'bg-green-100 border-l-4 border-green-500'
                                         }`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant={msg.type === 'received' ? 'default' : 'secondary'} className="text-xs">
                                          {msg.type === 'received' ? '👤 Cliente' : '🤖 Bot'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR')}
                                        </span>
                                      </div>
                                      <p className="text-sm">{msg.message}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Organizados */}
        <TabsContent value="leads">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  🔥 Leads Qualificados
                </CardTitle>
                <CardDescription>
                  Clientes com interesse real de compra que precisam de acompanhamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversations.filter(conv => conv.isLead).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum lead encontrado ainda.</p>
                      <p className="text-sm mt-1">Leads aparecem quando clientes demonstram interesse real de compra.</p>
                    </div>
                  ) : (
                    conversations.filter(conv => conv.isLead).map((conv, index) => (
                      <div key={`lead-${conv.user_id}-${index}`} 
                           className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                              {conv.userName ? conv.userName.slice(0, 2).toUpperCase() : conv.user_id.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-green-800">
                                🔥 {conv.userName || conv.user_id}
                              </h4>
                              <Badge variant="destructive" className="text-xs">
                                {conv.conversationStage?.toUpperCase() || 'LEAD QUENTE'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-700">
                              💰 OPORTUNIDADE ATIVA
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(conv.timestamp).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>

                        {/* Informações do lead */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {conv.selectedProduct && (
                            <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                              <div className="text-xs text-orange-600 font-medium mb-1">🛍️ PRODUTO DE INTERESSE</div>
                              <div className="font-medium">{conv.selectedProduct}</div>
                            </div>
                          )}
                          
                          {conv.userContact && (
                            <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                              <div className="text-xs text-blue-600 font-medium mb-1">📞 CONTACTO</div>
                              <div className="font-medium">{conv.userContact}</div>
                            </div>
                          )}
                          
                          {conv.userAddress && (
                            <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                              <div className="text-xs text-purple-600 font-medium mb-1">📍 ENDEREÇO</div>
                              <div className="font-medium">{conv.userAddress}</div>
                            </div>
                          )}
                          
                          <div className="bg-white p-3 rounded border-l-4 border-green-500">
                            <div className="text-xs text-green-600 font-medium mb-1">💬 INTERAÇÕES</div>
                            <div className="font-medium">{conv.messageCount} mensagens</div>
                          </div>
                        </div>

                        {/* Última mensagem */}
                        <div className="bg-white p-3 rounded border-l-4 border-gray-300">
                          <div className="text-xs text-gray-600 font-medium mb-1">💭 ÚLTIMA MENSAGEM</div>
                          <div className="text-sm">{conv.lastMessage}</div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            📞 Contactar Agora
                          </Button>
                          <Button size="sm" variant="outline">
                            📝 Ver Conversa Completa
                          </Button>
                          <Button size="sm" variant="outline">
                            ✅ Marcar como Convertido
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tempo Real */}
        <TabsContent value="realtime">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mensagens em Tempo Real */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    📡 Mensagens em Tempo Real
                  </CardTitle>
                  <CardDescription>
                    {realtimeLoading ? 'Carregando...' : `${messageCount} mensagens • Última atualização: ${lastUpdate?.toLocaleTimeString() || 'Nunca'}`}
                  </CardDescription>
                </div>
                <Button 
                  onClick={loadRealtimeMessages}
                  size="sm"
                  variant="outline"
                  disabled={realtimeLoading}
                >
                  {realtimeLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  ) : (
                    'Atualizar'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {realtimeMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem recente.</p>
                    </div>
                  ) : (
                    realtimeMessages.map((msg, index) => (
                      <div key={`${msg.id}-${index}`} className={`p-3 rounded-lg border ${
                        msg.type === 'received' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={msg.type === 'received' ? 'default' : 'secondary'}>
                            {msg.type === 'received' ? '📥 Recebida' : '📤 Enviada'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">👤 {msg.user_id.slice(0, 12)}:</span>
                          <p className="mt-1">{msg.message}</p>
                        </div>
                        <Badge variant="outline" className="text-xs mt-2">
                          {msg.platform}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  ⚙️ Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status do Bot */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">🤖 Status do Bot</h3>
                    <p className="text-sm text-muted-foreground">
                      {botEnabled ? 'Ativo - Respondendo automaticamente' : 'Desativo - Sem respostas automáticas'}
                    </p>
                  </div>
                  <Switch
                    checked={botEnabled}
                    onCheckedChange={handleBotToggle}
                  />
                </div>

                {/* Teste de Notificação Admin */}
                <div className="space-y-3">
                  <h3 className="font-medium">🧪 Testes do Sistema</h3>
                  <Button 
                    onClick={testAdminNotification}
                    variant="outline"
                    className="w-full"
                  >
                    Testar Notificação Admin
                  </Button>
                </div>

                {/* Teste de Mensagem */}
                <div className="space-y-3">
                  <Label htmlFor="test-message">📝 Testar Mensagem</Label>
                  <div className="flex gap-2">
                    <Input
                      id="test-message"
                      placeholder="Digite uma mensagem de teste..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                    />
                    <Button 
                      onClick={() => {
                        if (testMessage.trim()) {
                          sendTestMessage(testMessage);
                          setTestMessage('');
                        }
                      }}
                      disabled={!testMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Base de Conhecimento */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                🧠 Base de Conhecimento
              </CardTitle>
              <CardDescription>
                Informações que a IA pode consultar para responder perguntas específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Status da Base de Conhecimento</h3>
                    <p className="text-sm text-muted-foreground">
                      {knowledgeBaseEnabled 
                        ? 'Ativada - A IA pode buscar informações aqui quando necessário'
                        : 'Desativada - A IA não consultará a base de conhecimento'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={knowledgeBaseEnabled}
                    onCheckedChange={handleKnowledgeBaseToggle}
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {knowledgeBase.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum conhecimento cadastrado ainda.</p>
                      <Button className="mt-4" variant="outline">
                        Adicionar Conhecimento
                      </Button>
                    </div>
                  ) : (
                    knowledgeBase.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge variant={item.active ? 'default' : 'secondary'}>
                              {item.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Prioridade: {item.priority}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-medium mb-1">{item.question}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{item.answer}</p>
                        {item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAgentIA;