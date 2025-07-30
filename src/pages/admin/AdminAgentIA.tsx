import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Lightbulb,
  Settings,
  Save,
  Send,
  Activity,
  Eye,
  User,
  Key,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  sendAdminNotification,
  notifyConfigurationChanged,
  notifySystemError,
  performSystemHealthCheck,
  notifyAILearningFeedback
} from '@/utils/notifications';

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
  platform: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
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

interface LearningInsight {
  id: string;
  insight_type: string;
  content: string;
  confidence_score: number;
  usage_count: number;
  effectiveness_score: number;
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
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  
  // Estados de controle
  const [botEnabled, setBotEnabled] = useState(true);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadMetrics();
    loadRealtimeMessages();
    loadConversations();
    loadKnowledgeBase();
    loadLearningInsights();
    loadInitialSettings();
    
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
        // Converter e filtrar dados para o tipo correto
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
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (data) {
        // Agrupar por usuário e plataforma
        const grouped = data.reduce((acc: Record<string, any>, msg) => {
          const key = `${msg.user_id}-${msg.platform}`;
          if (!acc[key]) {
            acc[key] = {
              user_id: msg.user_id,
              platform: msg.platform,
              messages: [],
              lastMessage: msg.message,
              timestamp: msg.timestamp,
              messageCount: 0
            };
          }
          acc[key].messages.push(msg);
          acc[key].messageCount = acc[key].messages.length;
          return acc;
        }, {});
        
        setConversations(Object.values(grouped));
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

  const loadLearningInsights = async () => {
    try {
      const { data } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setLearningInsights(data);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  // Carregar configurações iniciais
  const loadInitialSettings = async () => {
    try {
      // Carregar configurações do bot
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('key, value')
        .in('key', ['bot_enabled', 'knowledge_base_enabled']);

      if (settings) {
        const settingsMap = settings.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});

        setBotEnabled(settingsMap.bot_enabled === 'true');
        setKnowledgeBaseEnabled(settingsMap.knowledge_base_enabled === 'true');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Funções de manipulação
  const handleBotToggle = async (enabled: boolean) => {
    const oldValue = botEnabled;
    setBotEnabled(enabled);
    
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({ 
          key: 'bot_enabled', 
          value: enabled.toString(),
          description: 'Bot habilitado/desabilitado'
        });
      
      if (error) throw error;
      
      // Notificar mudança de configuração
      await notifyConfigurationChanged(
        'Status do Bot',
        `Bot ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`,
        oldValue,
        enabled
      );
      
      toast.success(enabled ? 'Bot habilitado!' : 'Bot desabilitado!');
    } catch (error) {
      console.error('Erro ao alterar status do bot:', error);
      await notifySystemError('Erro ao alterar bot', error.message, { action: 'toggle_bot', enabled });
      toast.error('Erro ao salvar configuração');
      setBotEnabled(!enabled); // Reverter
    }
  };

  const handleKnowledgeBaseToggle = async (enabled: boolean) => {
    const oldValue = knowledgeBaseEnabled;
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
      
      // Notificar mudança de configuração
      await notifyConfigurationChanged(
        'Base de Conhecimento',
        `Base de conhecimento ${enabled ? 'ativada' : 'desativada'} com sucesso`,
        oldValue,
        enabled
      );
      
      toast.success(enabled ? 'Base de conhecimento ativada!' : 'Base de conhecimento desativada!');
    } catch (error) {
      console.error('Erro ao alterar base de conhecimento:', error);
      await notifySystemError('Erro na base de conhecimento', error.message, { action: 'toggle_knowledge_base', enabled });
      toast.error('Erro ao salvar configuração');
      setKnowledgeBaseEnabled(!enabled); // Reverter
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    
    try {
      // Salvar configurações no Supabase
      const settingsToSave = [
        { key: 'bot_enabled', value: botEnabled.toString(), description: 'Bot habilitado/desabilitado' },
        { key: 'knowledge_base_enabled', value: knowledgeBaseEnabled.toString(), description: 'Base de conhecimento ativa' }
      ];

      // Salvar todas as configurações
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('ai_settings')
          .upsert(setting);
        
        if (error) throw error;
      }

      // Notificar salvamento bem-sucedido
      await notifyConfigurationChanged(
        'Configurações Gerais',
        'Todas as configurações do agente IA foram salvas com sucesso',
        null,
        { bot_enabled: botEnabled, knowledge_base_enabled: knowledgeBaseEnabled }
      );
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      await notifySystemError('Erro ao salvar configurações', error.message, { bot_enabled: botEnabled, knowledge_base_enabled: knowledgeBaseEnabled });
      toast.error('Erro ao salvar configurações');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Função para criar notificações no sistema
  const createNotification = async (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    try {
      await supabase.from('notifications').insert({
        title,
        message,
        type,
        user_id: null // Notificação do sistema
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // Verificar status dos componentes do sistema
  const checkSystemHealth = async () => {
    try {
      const healthCheck = await performSystemHealthCheck();
      
      if (healthCheck.healthy) {
        toast.success('Sistema funcionando perfeitamente!');
      } else {
        toast.warning(`${healthCheck.issues.length} problema(s) detectado(s)`);
      }
      
      console.log('📊 Relatório de saúde:', healthCheck.report);
      
    } catch (error) {
      console.error('Erro na verificação do sistema:', error);
      await notifySystemError('Erro na verificação de saúde', error.message, error);
      toast.error('Erro ao verificar sistema');
    }
  };

  // Enviar notificação de teste
  const sendTestNotification = async () => {
    try {
      await sendAdminNotification({
        type: 'system_health_report',
        title: 'Teste de Notificação IA',
        message: 'Sistema de notificações funcionando corretamente!',
        priority: 'normal',
        data: { test: true, timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação');
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
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tempo Real
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas por Usuário
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Aprendizado IA
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Centro de Testes
          </TabsTrigger>
        </TabsList>

        {/* Tempo Real */}
        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${realtimeLoading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                Monitor de Mensagens em Tempo Real
              </CardTitle>
              <CardDescription>
                {realtimeLoading ? 'Carregando...' : `${messageCount} mensagens | Última atualização: ${lastUpdate?.toLocaleTimeString() || 'Nunca'}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enviar mensagem de teste..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && testMessage.trim()) {
                      sendTestMessage(testMessage);
                      setTestMessage('');
                    }
                  }}
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

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {realtimeMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma mensagem ainda.</p>
                  </div>
                ) : (
                  realtimeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg border ${
                        msg.type === 'received' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={msg.type === 'received' ? 'default' : 'secondary'}>
                            {msg.type === 'received' ? '📥 Recebida' : '📤 Enviada'}
                          </Badge>
                          <Badge variant="outline">{msg.platform}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-muted-foreground">
                          Usuário: {msg.user_id}
                        </p>
                        <p className="mt-1">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversas */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>🗨️ Conversas Organizadas por Usuário</CardTitle>
              <CardDescription>
                Visualize conversas agrupadas por usuário e plataforma para melhor acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conversa encontrada.</p>
                  </div>
                ) : (
                  Object.entries(
                    conversations.reduce((groups: Record<string, Conversation[]>, conv) => {
                      const key = `${conv.user_id}-${conv.platform}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(conv);
                      return groups;
                    }, {})
                  ).map(([key, convs]) => {
                    const conv = convs[0];
                    return (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {conv.user_id.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">{conv.user_id}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {conv.platform}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {conv.messageCount} mensagens
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(conv.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">Última mensagem:</span> {conv.lastMessage}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
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

        {/* Aprendizado IA */}
        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                🎓 Aprendizado da IA
              </CardTitle>
              <CardDescription>
                Insights e padrões aprendidos pela IA através das interações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{learningInsights.length}</div>
                      <div className="text-sm text-muted-foreground">Insights Coletados</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {learningInsights.filter(i => i.confidence_score > 0.8).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Alta Confiança</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {learningInsights.reduce((sum, i) => sum + i.usage_count, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Usos Totais</div>
                    </div>
                  </Card>
                </div>

                {/* Insights de Aprendizado */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">📊 Insights de Aprendizado</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {learningInsights.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>A IA ainda está coletando dados para gerar insights.</p>
                      </div>
                    ) : (
                      learningInsights.map((insight) => (
                        <div key={insight.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">{insight.insight_type}</Badge>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Confiança: {(insight.confidence_score * 100).toFixed(0)}%</span>
                              <span>Usado: {insight.usage_count}x</span>
                              <span>Eficácia: {(insight.effectiveness_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <p className="text-sm">{insight.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Como funciona o aprendizado */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">🔬 Como Funciona o Aprendizado</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 text-green-600">✅ Já Implementado</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Análise de padrões de conversação</li>
                          <li>• Identificação de temas frequentes</li>
                          <li>• Medição de eficácia das respostas</li>
                          <li>• Aprendizado com feedback implícito</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-blue-600">🚧 Próximas Otimizações</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Personalização por usuário</li>
                          <li>• Predição de intenções</li>
                          <li>• Auto-melhoria de respostas</li>
                          <li>• Detecção de sentimentos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configurations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ⚙️ Configurações da IA
              </CardTitle>
              <CardDescription>
                Configure APIs, modelo preferido e comportamento do bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Modelo OpenAI */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">🤖 Modelo OpenAI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Modelo Preferido</Label>
                      <select className="w-full p-2 border rounded-lg">
                        <option value="gpt-4o-mini">GPT-4o Mini - Rápido e Econômico</option>
                        <option value="gpt-4o">GPT-4o - Mais Inteligente</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo - Balanceado</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        GPT-4o Mini é recomendado para chatbot por ser rápido e econômico
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Chave API OpenAI</Label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="sk-..."
                          value="••••••••••••••••"
                          disabled
                        />
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="link" size="sm" className="p-0 h-auto text-blue-500">
                        → Obter chave API OpenAI
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Integração Facebook */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">📘 Integração Facebook</h3>
                  <div className="space-y-2">
                    <Label>Token Página Facebook</Label>
                    <Input
                      type="password"
                      placeholder="Token de acesso da página..."
                      value="••••••••••••••••"
                      disabled
                    />
                    <Button variant="link" size="sm" className="p-0 h-auto text-blue-500">
                      → Obter token Facebook
                    </Button>
                  </div>
                </div>

                {/* Integração Instagram */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">📸 Integração Instagram</h3>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Habilitar Bot Instagram</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Token Página Instagram</Label>
                    <Input
                      type="password"
                      placeholder="Use o mesmo token do Facebook se sua página está conectada ao Instagram"
                      disabled
                    />
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        💡 Use o mesmo token do Facebook se sua página está conectada ao Instagram
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comportamento do Bot */}
                <div className="border-t pt-6 space-y-6">
                  <h3 className="text-lg font-semibold">🎯 Comportamento do Bot</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tom das Respostas</Label>
                        <select className="w-full p-2 border rounded-lg">
                          <option value="friendly">Amigável</option>
                          <option value="professional">Profissional</option>
                          <option value="casual">Casual</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho Máximo</Label>
                        <Input type="number" defaultValue="200" />
                        <p className="text-xs text-muted-foreground">
                          Número máximo de caracteres por resposta
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Respostas Automáticas</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Base de Conhecimento Ativada</Label>
                        <Switch
                          checked={knowledgeBaseEnabled}
                          onCheckedChange={handleKnowledgeBaseToggle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escalation para Humano */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">👤 Escalation para Humano</h3>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Habilitar Escalation Automático</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID Facebook do Admin (carlosfox)</Label>
                      <Input defaultValue="carlosfox" />
                      <p className="text-xs text-muted-foreground">
                        Este usuário receberá notificações quando clientes quiserem finalizar compras
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Palavras-chave para Escalation</Label>
                      <textarea 
                        className="w-full p-2 border rounded-lg h-20"
                        defaultValue="comprar,finalizar,problema,ajuda,atendente"
                        placeholder="Separe palavras-chave por vírgula"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe palavras-chave por vírgula. Quando detectadas, admin será notificado.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controle Chat Humano/IA */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">🎭 Controle Chat Humano/IA</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <Label className="font-medium">Sistema Inteligente Ativado</Label>
                    </div>
                    <ul className="text-sm space-y-1 text-green-700">
                      <li>• IA **para automaticamente** quando humano responde no chat</li>
                      <li>• IA **analisa contexto completo** das conversas antes de responder</li>
                      <li>• IA **responde diretamente** às perguntas específicas</li>
                      <li>• IA **não envia produtos** sem solicitação</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Modo de Operação Atual</Label>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">IA Inteligente + Controle Humano</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Sistema detecta automaticamente quando humano está ativo e pausa a IA
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tempo de Pausa</Label>
                      <Input type="number" defaultValue="30" />
                      <p className="text-xs text-muted-foreground">
                        IA fica pausada por 30min após atividade humana
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sincronização */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">🔄 Sincronização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Sincronizar com Secrets
                    </Button>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Usar Token Meta
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Verificar Tabelas
                    </Button>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 Use "Usar Token Meta" para sincronizar o token que você salvou na página de configurações Meta/Facebook
                    </p>
                  </div>
                </div>

                {/* Links Úteis */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">🔗 Links Úteis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-medium">Webhook Facebook</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          URL para configurar no Facebook
                        </p>
                        <div className="text-xs bg-gray-100 p-2 rounded">
                          https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          <div className="h-3 w-3 mr-1" />
                          Copiar URL
                        </Button>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="text-center">
                        <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-medium">Facebook Developers</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Configure seu app Facebook
                        </p>
                        <Button variant="outline" size="sm">
                          Abrir Console
                        </Button>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="text-center">
                        <Key className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <h4 className="font-medium">OpenAI Platform</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Gerencie suas chaves API
                        </p>
                        <Button variant="outline" size="sm">
                          Acessar
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  className="w-full"
                  size="lg"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Salvando Configurações...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Centro de Testes */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                🧪 Centro de Testes
              </CardTitle>
              <CardDescription>
                Teste todas as APIs e funcionalidades do agente IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Testes de API */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <Bot className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Testar OpenAI</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <div className="text-sm font-medium">Testar Facebook</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-16 border-blue-500 text-blue-600">
                    <div className="text-center">
                      <Activity className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Debug Mensagens</div>
                    </div>
                  </Button>
                </div>

                {/* Testes Avançados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="default" className="h-16 bg-green-500 hover:bg-green-600">
                    <div className="text-center text-white">
                      <Send className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Teste Envio Real</div>
                    </div>
                  </Button>
                  
                  <Button variant="default" className="h-16 bg-orange-500 hover:bg-orange-600">
                    <div className="text-center text-white">
                      <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Teste Completo</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-16 border-purple-500 text-purple-600">
                    <div className="text-center">
                      <Brain className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Testar Instagram</div>
                    </div>
                  </Button>
                </div>

                {/* Validação e Debug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 border-blue-500 text-blue-600"
                    onClick={checkSystemHealth}
                  >
                    <div className="text-center">
                      <Key className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Verificar Sistema</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-16 border-green-500 text-green-600"
                    onClick={sendTestNotification}
                  >
                    <div className="text-center">
                      <Send className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Teste Notificação</div>
                    </div>
                  </Button>
                </div>

                {/* Nova seção: Sistema de Notificações */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">🔔 Sistema de Notificações</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-16"
                      onClick={sendTestNotification}
                    >
                      <div className="text-center">
                        <Send className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                        <div className="text-sm font-medium">Enviar Teste</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-16"
                      onClick={checkSystemHealth}
                    >
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
                        <div className="text-sm font-medium">Status Sistema</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="h-16">
                      <div className="text-center">
                        <Settings className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                        <div className="text-sm font-medium">Config Alertas</div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Sistema de Notificações Ativo</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• ✅ Notificações de configurações salvas</li>
                      <li>• ✅ Alertas de erro no sistema</li>
                      <li>• ✅ Verificação automática de saúde</li>
                      <li>• ✅ Feedback de aprendizado IA</li>
                      <li>• ✅ Notificações de pedidos pendentes</li>
                    </ul>
                  </div>
                </div>

                {/* Configuração do Webhook Facebook */}
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Configuração do Webhook Facebook</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para o bot responder automaticamente, você precisa configurar o webhook no Facebook:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">1. URL do Webhook</Label>
                      <div className="flex gap-2">
                        <Input 
                          value="https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook"
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button variant="outline" size="sm">
                          Copiar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium">2. Verify Token</Label>
                      <div className="flex gap-2">
                        <Input 
                          value="minha_superloja_webhook_token_2024"
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button variant="outline" size="sm">
                          Copiar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium">3. Configurar no Facebook</Label>
                      <div className="space-y-2 text-sm">
                        <p>1. Acesse <Button variant="link" className="p-0 h-auto text-blue-500">Facebook Developers</Button></p>
                        <p>2. Vá para sua aplicação → Produtos → Messenger → Configurações</p>
                        <p>3. Na seção "Webhooks", clique em "Configurar Webhooks"</p>
                        <p>4. Cole a URL do webhook acima</p>
                        <p>5. Cole o Verify Token acima</p>
                        <p>6. Selecione os eventos: <code>messages, messaging_postbacks</code></p>
                        <p>7. Clique em "Verificar e Salvar"</p>
                        <p>8. Depois, associe o webhook à sua página</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <div className="bg-yellow-400 rounded-full p-1 mt-0.5">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-800">Verificações Importantes</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Certifique-se que o token da página tem permissão <code>pages_messaging</code></li>
                          <li>• A página deve estar em modo "Desenvolvedor" ou "Ativo"</li>
                          <li>• O webhook deve estar associado especificamente à sua página</li>
                          <li>• Teste mandando uma mensagem para a página após a configuração</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex flex-wrap gap-2 mt-6">
                    <Button size="sm">
                      Abrir Facebook Developers
                    </Button>
                    <Button variant="outline" size="sm">
                      Testar Webhook
                    </Button>
                    <Button variant="outline" size="sm" className="text-blue-600">
                      Verificar Mensagens
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-600">
                      Sincronizar Tokens
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      Configurar Subscrição
                    </Button>
                    <Button variant="outline" size="sm" className="text-purple-600">
                      Testar Sistema
                    </Button>
                    <Button variant="outline" size="sm">
                      Testar Webhook
                    </Button>
                  </div>
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