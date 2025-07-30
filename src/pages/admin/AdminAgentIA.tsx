import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  sendAdminNotification,
  notifyConfigurationChanged,
  notifySystemError,
  performSystemHealthCheck,
  notifyAILearningFeedback
} from '@/utils/notifications';
import { RealTimeTab } from '@/components/admin/RealTimeTab';
import { KnowledgeBaseTab } from '@/components/admin/KnowledgeBaseTab';
import { LearningTab } from '@/components/admin/LearningTab';
import { ConfigurationsTab } from '@/components/admin/ConfigurationsTab';
import { TestsTab } from '@/components/admin/TestsTab';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [messageCount, setMessageCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estados para configurações adicionais
  const [adminFacebookId, setAdminFacebookId] = useState('');
  const [adminBackupId, setAdminBackupId] = useState('');
  const [escalationKeywords, setEscalationKeywords] = useState('comprar,finalizar,problema,ajuda,atendente,humano');
  const [escalationTime, setEscalationTime] = useState(10);

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

  const loadInitialSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('key, value')
        .in('key', ['bot_enabled', 'knowledge_base_enabled', 'admin_facebook_id', 'admin_backup_id', 'escalation_keywords', 'escalation_time']);

      if (settings) {
        const settingsMap = settings.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});

        setBotEnabled(settingsMap.bot_enabled === 'true');
        setKnowledgeBaseEnabled(settingsMap.knowledge_base_enabled === 'true');
        setAdminFacebookId(settingsMap.admin_facebook_id || '');
        setAdminBackupId(settingsMap.admin_backup_id || '');
        setEscalationKeywords(settingsMap.escalation_keywords || 'comprar,finalizar,problema,ajuda,atendente');
        setEscalationTime(parseInt(settingsMap.escalation_time || '10'));
        
        console.log('📋 Configurações carregadas:', settingsMap);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
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
      setBotEnabled(!enabled);
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
      setKnowledgeBaseEnabled(!enabled);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    
    try {
      console.log('💾 === INICIANDO SALVAMENTO CONFIGURAÇÕES ===');
      
      const settingsToSave = [
        { key: 'bot_enabled', value: botEnabled.toString(), description: 'Bot habilitado/desabilitado' },
        { key: 'knowledge_base_enabled', value: knowledgeBaseEnabled.toString(), description: 'Base de conhecimento ativa' },
        { key: 'admin_facebook_id', value: adminFacebookId.trim(), description: 'ID Facebook do admin principal' },
        { key: 'admin_backup_id', value: adminBackupId.trim(), description: 'ID Facebook do admin backup' },
        { key: 'escalation_keywords', value: escalationKeywords, description: 'Palavras-chave para escalation' },
        { key: 'escalation_time', value: escalationTime.toString(), description: 'Tempo para escalation em minutos' }
      ];

      console.log('📦 Settings preparadas:', settingsToSave);

      // Salvar cada setting individualmente para evitar problemas de constraint
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('ai_settings')
          .upsert(setting, { 
            onConflict: 'key',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`❌ Erro ao salvar ${setting.key}:`, error);
          throw error;
        }
        console.log(`✅ ${setting.key} salvo com sucesso`);
      }
      
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

  const sendTestNotification = async () => {
    try {
      await sendAdminNotification({
        type: 'system_health_report',
        title: 'Teste de Notificação IA',
        message: 'Sistema de notificações funcionando corretamente!',
        priority: 'normal',
        data: { test: true, timestamp: new Date().toISOString() }
      });
      toast.success('Notificação de teste enviada!');
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast.error('Erro ao enviar notificação');
    }
  };

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

      {/* Tabs principais */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="realtime">
            Tempo Real
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="learning">
            Aprendizado IA
          </TabsTrigger>
          <TabsTrigger value="configurations">
            Configurações
          </TabsTrigger>
          <TabsTrigger value="tests">
            Centro de Testes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeTab
            metrics={metrics}
            realtimeMessages={realtimeMessages}
            conversations={conversations}
            messageCount={messageCount}
            lastUpdate={lastUpdate}
            realtimeLoading={realtimeLoading}
          />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBaseTab
            knowledgeBase={knowledgeBase}
            onReload={loadKnowledgeBase}
          />
        </TabsContent>

        <TabsContent value="learning">
          <LearningTab learningInsights={learningInsights} />
        </TabsContent>

        <TabsContent value="configurations">
          <ConfigurationsTab
            botEnabled={botEnabled}
            knowledgeBaseEnabled={knowledgeBaseEnabled}
            adminFacebookId={adminFacebookId}
            adminBackupId={adminBackupId}
            escalationKeywords={escalationKeywords}
            escalationTime={escalationTime}
            settingsLoading={settingsLoading}
            onBotToggle={handleBotToggle}
            onKnowledgeBaseToggle={handleKnowledgeBaseToggle}
            onAdminFacebookIdChange={setAdminFacebookId}
            onAdminBackupIdChange={setAdminBackupId}
            onEscalationKeywordsChange={setEscalationKeywords}
            onEscalationTimeChange={setEscalationTime}
            onSaveSettings={handleSaveSettings}
          />
        </TabsContent>

        <TabsContent value="tests">
          <TestsTab
            onSendTestNotification={sendTestNotification}
            onCheckSystemHealth={checkSystemHealth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAgentIA;