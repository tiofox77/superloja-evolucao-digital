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
  Bot,
  Brain,
  Lightbulb,
  Settings,
  Save,
  Activity,
  Key,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  sendAdminNotification,
  notifyConfigurationChanged,
  notifySystemError,
  performSystemHealthCheck
} from '@/utils/notifications';
import { 
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  toggleKnowledgeActive,
  saveAdminSettings,
  type KnowledgeItem
} from '@/utils/knowledgeBase';
import { KnowledgeForm } from '@/components/admin/KnowledgeForm';

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
  const [botEnabled, setBotEnabled] = useState(true);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(true);

  // Estados para formulário de conhecimento
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeItem | null>(null);
  
  // Estados para escalation expandido
  const [escalationEnabled, setEscalationEnabled] = useState(true);
  const [adminFacebookId, setAdminFacebookId] = useState('');
  const [adminBackupId, setAdminBackupId] = useState('');
  const [escalationTime, setEscalationTime] = useState(5);
  const [escalationKeywords, setEscalationKeywords] = useState('');
  const [emailNotificationEnabled, setEmailNotificationEnabled] = useState(true);
  const [escalationEmail, setEscalationEmail] = useState('');
  const [whatsappNotificationEnabled, setWhatsappNotificationEnabled] = useState(false);
  const [escalationWhatsapp, setEscalationWhatsapp] = useState('');

  // Funções de carregamento
  const loadMetrics = async () => {
    try {
      // Simular carregamento de métricas
      setMetrics({
        totalMessages: 1247,
        uniqueUsers: 89,
        averageRating: 4.2,
        successfulInteractions: 92,
        leadsGenerated: 23
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setKnowledgeBase(data || []);
    } catch (error) {
      console.error('Erro ao carregar base de conhecimento:', error);
      toast.error('Erro ao carregar base de conhecimento');
    }
  };

  const loadLearningInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLearningInsights(data || []);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  // Configurações
  const handleSaveSettings = async () => {
    try {
      const settings = {
        adminFacebookId: adminFacebookId.trim(),
        adminBackupId: adminBackupId.trim(),
        escalationKeywords,
        escalationTime,
        botEnabled,
        knowledgeBaseEnabled
      };

      console.log('💾 Salvando configurações:', settings);
      
      await saveAdminSettings(settings);
      
      // Enviar notificação de alteração
      await sendAdminNotification({
        type: 'ai_config_changed',
        title: 'Configuração alterada: Configurações Gerais',
        message: `⚙️ CONFIGURAÇÃO ALTERADA\n\nAlteração: Configurações da IA atualizadas\n\nDetalhes:\n• Admin Principal: ${adminFacebookId || 'Não definido'}\n• Admin Backup: ${adminBackupId || 'Não definido'}\n• Bot Ativo: ${botEnabled ? 'Sim' : 'Não'}\n• Base de Conhecimento: ${knowledgeBaseEnabled ? 'Ativa' : 'Inativa'}`,
        priority: 'normal',
        data: { 
          settings,
          changed_by: 'admin',
          change_type: 'general_settings'
        }
      });

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      
      await sendAdminNotification({
        type: 'system_error',
        title: 'Erro ao salvar configurações',
        message: `❌ Erro ao salvar configurações: ${error.message}`,
        priority: 'high',
        data: { error: error.message }
      });
    }
  };

  const handleKnowledgeBaseToggle = async (enabled: boolean) => {
    setKnowledgeBaseEnabled(enabled);
    toast.success(`Base de conhecimento ${enabled ? 'ativada' : 'desativada'}!`);
  };

  // CRUD da base de conhecimento
  const handleAddKnowledge = async (knowledge: Omit<KnowledgeItem, 'id'>) => {
    try {
      const newKnowledge = await addKnowledge(knowledge);
      setKnowledgeBase(prev => [newKnowledge, ...prev]);
      setShowKnowledgeForm(false);
      setEditingKnowledge(null);
      await loadKnowledgeBase();
    } catch (error) {
      console.error('Erro ao adicionar conhecimento:', error);
    }
  };

  const handleUpdateKnowledge = async (id: string, updates: Partial<KnowledgeItem>) => {
    try {
      const updated = await updateKnowledge(id, updates);
      setKnowledgeBase(prev => prev.map(item => item.id === id ? updated : item));
      setShowKnowledgeForm(false);
      setEditingKnowledge(null);
      await loadKnowledgeBase();
    } catch (error) {
      console.error('Erro ao atualizar conhecimento:', error);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await deleteKnowledge(id);
      setKnowledgeBase(prev => prev.filter(item => item.id !== id));
      await loadKnowledgeBase();
    } catch (error) {
      console.error('Erro ao deletar conhecimento:', error);
    }
  };

  const handleToggleKnowledgeActive = async (id: string, active: boolean) => {
    try {
      const updated = await toggleKnowledgeActive(id, active);
      setKnowledgeBase(prev => prev.map(item => item.id === id ? updated : item));
      await loadKnowledgeBase();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadMetrics();
    loadKnowledgeBase();
    loadLearningInsights();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Agente IA SuperLoja
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
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageRating}/5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successfulInteractions}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.leadsGenerated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="knowledge" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge">🧠 Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="learning">🎓 Aprendizado IA</TabsTrigger>
          <TabsTrigger value="conversations">💬 Conversas</TabsTrigger>
          <TabsTrigger value="configurations">⚙️ Configurações</TabsTrigger>
        </TabsList>

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

                <div className="mb-4 flex justify-between items-center">
                  <h4 className="text-sm font-medium">Conhecimentos Cadastrados ({knowledgeBase.length})</h4>
                  <Button 
                    onClick={() => setShowKnowledgeForm(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {knowledgeBase.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum conhecimento cadastrado ainda.</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => setShowKnowledgeForm(true)}
                      >
                        Adicionar Primeiro Conhecimento
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingKnowledge(item);
                                setShowKnowledgeForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleKnowledgeActive(item.id!, !item.active)}
                            >
                              {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja deletar este conhecimento?')) {
                                  handleDeleteKnowledge(item.id!);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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

          {/* Modal/Formulário para Adicionar/Editar Conhecimento */}
          {showKnowledgeForm && (
            <KnowledgeForm
              knowledge={editingKnowledge}
              onSave={editingKnowledge ? 
                (updates) => handleUpdateKnowledge(editingKnowledge.id!, updates) :
                handleAddKnowledge
              }
              onCancel={() => {
                setShowKnowledgeForm(false);
                setEditingKnowledge(null);
              }}
            />
          )}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversas */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                💬 Conversas Recentes
              </CardTitle>
              <CardDescription>
                Visualize conversas agrupadas por usuário e plataforma para melhor acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conversa encontrada.</p>
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
                {/* Escalation para Humano - EXPANDIDO */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">👤 Escalation para Humano</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Habilitar Escalation Automático</Label>
                        <Switch 
                          checked={escalationEnabled}
                          onCheckedChange={setEscalationEnabled}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ID Facebook do Admin Principal</Label>
                        <Input
                          value={adminFacebookId}
                          onChange={(e) => setAdminFacebookId(e.target.value)}
                          placeholder="Ex: 123456789"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ID Facebook do Admin Backup</Label>
                        <Input
                          value={adminBackupId}
                          onChange={(e) => setAdminBackupId(e.target.value)}
                          placeholder="Ex: 987654321"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tempo para Escalation (minutos)</Label>
                        <Input
                          type="number"
                          value={escalationTime}
                          onChange={(e) => setEscalationTime(Number(e.target.value))}
                          placeholder="Ex: 5"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Palavras-chave para Escalation</Label>
                        <textarea
                          className="w-full p-2 border rounded-lg"
                          rows={3}
                          value={escalationKeywords}
                          onChange={(e) => setEscalationKeywords(e.target.value)}
                          placeholder="problema, urgente, falar com humano, reclamação"
                        />
                        <p className="text-xs text-muted-foreground">
                          Separe por vírgula. Quando detectadas, a conversa será escalada
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label>Notificações de Escalation</Label>
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Notificação por Email</Label>
                          <Switch 
                            checked={emailNotificationEnabled}
                            onCheckedChange={setEmailNotificationEnabled}
                          />
                        </div>
                        
                        {emailNotificationEnabled && (
                          <div className="ml-4 space-y-2">
                            <Input
                              value={escalationEmail}
                              onChange={(e) => setEscalationEmail(e.target.value)}
                              placeholder="admin@superloja.com"
                              type="email"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Notificação por WhatsApp</Label>
                          <Switch 
                            checked={whatsappNotificationEnabled}
                            onCheckedChange={setWhatsappNotificationEnabled}
                          />
                        </div>
                        
                        {whatsappNotificationEnabled && (
                          <div className="ml-4 space-y-2">
                            <Input
                              value={escalationWhatsapp}
                              onChange={(e) => setEscalationWhatsapp(e.target.value)}
                              placeholder="+5511999999999"
                              type="tel"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <Button 
                      onClick={handleSaveSettings}
                      className="w-full md:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Todas as Configurações
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