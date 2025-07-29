import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, TrendingUp, Settings, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIMetric {
  total_messages: number;
  unique_users: number;
  avg_confidence: number;
  successful_interactions: number;
  leads_generated: number;
}

interface Conversation {
  id: string;
  platform: string;
  user_id: string;
  message: string;
  type: 'sent' | 'received';
  timestamp: string;
}

interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
}

interface AISettings {
  openai_api_key: string;
  facebook_page_token: string;
  bot_enabled: boolean;
  max_response_length: number;
  fallback_to_human: boolean;
  response_tone: string;
  auto_response_enabled: string;
  preferred_model: string;
}

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'testing';
  message: string;
  details?: any;
}

export default function AdminAgentIA() {
  const [metrics, setMetrics] = useState<AIMetric | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para formulários
  const [newKnowledge, setNewKnowledge] = useState({
    category: '',
    question: '',
    answer: '',
    keywords: '',
    priority: 3
  });
  
  const [settings, setSettings] = useState<AISettings>({
    openai_api_key: '',
    facebook_page_token: '',
    bot_enabled: true,
    max_response_length: 200,
    fallback_to_human: true,
    response_tone: '',
    auto_response_enabled: '',
    preferred_model: 'gpt-4o-mini'
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadConversations(),
        loadKnowledgeBase(),
        loadSettings()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await (supabase as any)
      .from('ai_metrics')
      .select('*')
      .eq('date', today)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar métricas:', error);
      return;
    }
    
    setMetrics(data || {
      total_messages: 0,
      unique_users: 0,
      avg_confidence: 0,
      successful_interactions: 0,
      leads_generated: 0
    });
  };

  const loadConversations = async () => {
    const { data, error } = await (supabase as any)
      .from('ai_conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error('Erro ao carregar conversas:', error);
      return;
    }
    
    setConversations(data || []);
  };

  const loadKnowledgeBase = async () => {
    const { data, error } = await (supabase as any)
      .from('ai_knowledge_base')
      .select('*')
      .order('priority', { ascending: false });
      
    if (error) {
      console.error('Erro ao carregar base de conhecimento:', error);
      return;
    }
    
    setKnowledgeBase(data || []);
  };

  const loadSettings = async () => {
    console.log('loadSettings iniciado');
    
    const { data, error } = await (supabase as any)
      .from('ai_settings')
      .select('*');
      
    if (error) {
      console.error('Erro ao carregar configurações:', error);
      return;
    }
    
    console.log('Dados carregados do banco:', data);
    
    const settingsObj: any = {
      openai_api_key: '',
      facebook_page_token: '',
      bot_enabled: 'true',
      max_response_length: '200',
      fallback_to_human: 'true',
      response_tone: 'amigavel',
      auto_response_enabled: 'true',
      preferred_model: 'gpt-4o-mini'
    };
    
    // Sobrescrever com dados do banco
    data?.forEach(setting => {
      settingsObj[setting.key] = setting.value || '';
    });
    
    console.log('Settings processados:', settingsObj);
    setSettings(settingsObj);
  };

  const syncWithSecrets = async () => {
    const toastId = toast.loading('Sincronizando com secrets do Supabase...');
    
    try {
      console.log('🔄 Iniciando sincronização...');
      
      // Chamar edge function para sincronizar
      const { data, error } = await supabase.functions.invoke('sync-ai-secrets', {
        body: {
          openai_api_key: settings.openai_api_key,
          facebook_page_token: settings.facebook_page_token
        }
      });

      console.log('📤 Resposta da sincronização:', { data, error });

      if (error) {
        console.error('❌ Erro na sincronização:', error);
        throw error;
      }
      
      toast.dismiss(toastId);
      toast.success('✅ Secrets sincronizados com sucesso!');
      console.log('✅ Sincronização completa:', data);
      
    } catch (error: any) {
      console.error('💥 Erro completo:', error);
      toast.dismiss(toastId);
      toast.error(`❌ Erro: ${error.message || 'Falha na sincronização'}`);
    }
  };

  const testOpenAI = async () => {
    const testResult: TestResult = {
      service: 'OpenAI',
      status: 'testing',
      message: 'Testando conexão...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'OpenAI'), testResult]);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-openai', {
        body: {
          api_key: settings.openai_api_key,
          model: settings.preferred_model
        }
      });

      if (error) throw error;
      
      const successResult = {
        service: 'OpenAI',
        status: 'success' as const,
        message: `✅ Modelo ${settings.preferred_model} funcionando`,
        details: data
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'OpenAI'), successResult]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'OpenAI',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'OpenAI'), errorResult]);
    }
  };

  const testFacebook = async () => {
    const testResult: TestResult = {
      service: 'Facebook',
      status: 'testing',
      message: 'Testando token...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook'), testResult]);
    
    try {
      console.log('🧪 Testando Facebook...');
      
      const { data, error } = await supabase.functions.invoke('test-facebook', {
        body: {
          page_token: settings.facebook_page_token
        }
      });

      console.log('📤 Resposta Facebook:', { data, error });

      if (error) {
        console.error('❌ Erro Facebook:', error);
        throw error;
      }
      
      const successResult = {
        service: 'Facebook',
        status: 'success' as const,
        message: data.token_type === 'page' 
          ? `✅ Token válido - Página: ${data.page_name}` 
          : `✅ Token de usuário válido - ${data.total_pages} página(s) acessível(eis)`,
        details: data,
        timestamp: new Date().toLocaleString()
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook'), successResult]);
      
      // Se for token de usuário, mostrar aviso sobre permissão
      if (data.token_type === 'user' && !data.messaging_permission) {
        toast.warning('⚠️  Token de usuário sem permissão pages_messaging. Use o helper abaixo para obter token de página.');
      } else if (data.token_type === 'page' && data.messaging_permission) {
        toast.success('🎉 Token de página válido com permissões de mensagem!');
      } else if (data.token_type === 'page' && !data.messaging_permission) {
        toast.warning('⚠️  Token de página sem permissão pages_messaging');
      }
      
    } catch (error: any) {
      const errorResult = {
        service: 'Facebook',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook'), errorResult]);
    }
  };

  const testWebhook = async () => {
    const testResult: TestResult = {
      service: 'Webhook',
      status: 'testing',
      message: 'Testando webhook...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Webhook'), testResult]);
    
    try {
      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      let message = '';
      
      if (response.status === 403) {
        message = '✅ Webhook funcionando (403 é esperado para teste direto)';
      } else if (response.ok) {
        message = '✅ Webhook respondendo corretamente!';
      } else {
        message = `❌ Webhook retornou status: ${response.status}`;
      }
      
      const successResult = {
        service: 'Webhook',
        status: 'success' as const,
        message,
        details: { status: response.status, ok: response.ok }
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Webhook'), successResult]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Webhook',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Webhook'), errorResult]);
    }
  };

  const testCompleteSystem = async () => {
    toast.loading('Executando teste completo do sistema...');
    
    await Promise.all([
      testOpenAI(),
      testFacebook(),
      testWebhook()
    ]);
    
    toast.dismiss();
    toast.success('🔍 Teste completo finalizado!');
  };

  const handleAddKnowledge = async () => {
    if (!newKnowledge.question || !newKnowledge.answer) {
      toast.error('Pergunta e resposta são obrigatórias');
      return;
    }
    
    const keywords = newKnowledge.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    
    const { error } = await (supabase as any)
      .from('ai_knowledge_base')
      .insert({
        category: newKnowledge.category || 'geral',
        question: newKnowledge.question,
        answer: newKnowledge.answer,
        keywords,
        priority: newKnowledge.priority,
        active: true
      });
      
    if (error) {
      console.error('Erro ao adicionar conhecimento:', error);
      toast.error('Erro ao adicionar conhecimento');
      return;
    }
    
    toast.success('Conhecimento adicionado com sucesso!');
    setNewKnowledge({
      category: '',
      question: '',
      answer: '',
      keywords: '',
      priority: 3
    });
    
    loadKnowledgeBase();
  };

  const handleDeleteKnowledge = async (id: string) => {
    const { error } = await (supabase as any)
      .from('ai_knowledge_base')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Erro ao deletar conhecimento:', error);
      toast.error('Erro ao deletar conhecimento');
      return;
    }
    
    toast.success('Conhecimento deletado!');
    loadKnowledgeBase();
  };

  const testTables = async () => {
    try {
      toast.loading('Verificando tabelas...');
      
      const { data, error } = await (supabase as any)
        .from('ai_settings')
        .select('*')
        .limit(1);
        
      toast.dismiss();
      
      if (error) {
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          toast.error('❌ Tabelas AI não existem! Execute a migração.');
        } else {
          toast.error(`❌ Erro: ${error.message}`);
        }
      } else {
        toast.success('✅ Tabelas AI existem! Pode salvar configurações.');
        console.log('Dados encontrados:', data);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`❌ Erro de teste: ${error.message}`);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: { [key: string]: string } = {
      'openai_api_key': 'Chave da API OpenAI para GPT models',
      'facebook_page_token': 'Token da página Facebook para Messenger',
      'bot_enabled': 'Bot habilitado/desabilitado',
      'max_response_length': 'Tamanho máximo das respostas',
      'fallback_to_human': 'Transferir para humano quando não entender',
      'response_tone': 'Tom das respostas: profissional, amigavel, casual',
      'auto_response_enabled': 'Respostas automáticas ativadas',
      'preferred_model': 'Modelo OpenAI preferido para respostas'
    };
    return descriptions[key] || `Configuração: ${key}`;
  };

  const handleSaveSettings = async () => {
    console.log('handleSaveSettings iniciado');
    console.log('Settings atuais:', settings);
    
    setSaving(true);
    
    try {
      // Mostrar toast de carregamento
      toast.loading('Salvando configurações...');
      
      // Converter settings para formato do banco
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value || ''),
        description: getSettingDescription(key),
        updated_at: new Date().toISOString()
      }));
      
      console.log('Updates a serem salvos:', updates);
      
      // Verificar se supabase existe
      if (!supabase) {
        throw new Error('Supabase não está disponível');
      }
      
      // Tentar salvar cada configuração
      let savedCount = 0;
      for (const update of updates) {
        console.log('Salvando:', update.key, '=', update.value);
        
        const { data, error } = await (supabase as any)
          .from('ai_settings')
          .upsert(update, { onConflict: 'key' });
          
        if (error) {
          console.error('Erro detalhado:', error);
          throw error;
        }
        
        console.log('Salvou com sucesso:', update.key);
        savedCount++;
      }
      
      // Limpar toasts anteriores e mostrar sucesso
      toast.dismiss();
      toast.success(`✅ ${savedCount} configurações salvas com sucesso!`);
      
      // Recarregar para confirmar
      console.log('Recarregando settings...');
      await loadSettings();
      console.log('Recarregamento concluído!');
      
      // Pequena pausa para garantir que o estado foi atualizado
      setTimeout(() => {
        console.log('Estado final dos settings:', settings);
      }, 100);
      
    } catch (error: any) {
      console.error('Erro completo ao salvar:', error);
      
      // Limpar toasts de loading
      toast.dismiss();
      
      // Mostrar erro específico
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        toast.error('⚠️ Tabelas AI não criadas! Execute: ai-agent-migration.sql no Supabase');
      } else if (error.message?.includes('Supabase não está disponível')) {
        toast.error('❌ Erro de conexão com Supabase');
      } else {
        toast.error(`❌ Erro: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agente IA SuperLoja</h1>
          <p className="text-muted-foreground">
            Gerencie o assistente virtual da SuperLoja
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_messages || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.unique_users || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_confidence ? `${(metrics.avg_confidence * 100).toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações OK</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.successful_interactions || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.leads_generated || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Aba Conversas */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <CardDescription>
                Últimas 50 mensagens do agente IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div key={conv.id} className={`
                    p-3 rounded-lg border
                    ${conv.type === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={conv.platform === 'facebook' ? 'default' : 'secondary'}>
                          {conv.platform}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {conv.user_id.substring(0, 8)}...
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.timestamp).toLocaleString('pt-AO')}
                      </span>
                    </div>
                    <p className="text-sm">{conv.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Base de Conhecimento */}
        <TabsContent value="knowledge">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário para adicionar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Conhecimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newKnowledge.category}
                    onChange={(e) => setNewKnowledge({...newKnowledge, category: e.target.value})}
                    placeholder="ex: produtos, políticas"
                  />
                </div>
                
                <div>
                  <Label htmlFor="question">Pergunta</Label>
                  <Input
                    id="question"
                    value={newKnowledge.question}
                    onChange={(e) => setNewKnowledge({...newKnowledge, question: e.target.value})}
                    placeholder="Como posso ajudar com..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="answer">Resposta</Label>
                  <Textarea
                    id="answer"
                    value={newKnowledge.answer}
                    onChange={(e) => setNewKnowledge({...newKnowledge, answer: e.target.value})}
                    placeholder="Resposta detalhada..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    value={newKnowledge.keywords}
                    onChange={(e) => setNewKnowledge({...newKnowledge, keywords: e.target.value})}
                    placeholder="produto, comprar, entrega"
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridade (1-5)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="5"
                    value={newKnowledge.priority}
                    onChange={(e) => setNewKnowledge({...newKnowledge, priority: parseInt(e.target.value)})}
                  />
                </div>
                
                <Button onClick={handleAddKnowledge} className="w-full">
                  Adicionar
                </Button>
              </CardContent>
            </Card>

            {/* Lista de conhecimentos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Base de Conhecimento</CardTitle>
                  <CardDescription>
                    {knowledgeBase.length} itens cadastrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {knowledgeBase.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge>{item.category}</Badge>
                            <Badge variant="outline">Prioridade {item.priority}</Badge>
                            {!item.active && <Badge variant="destructive">Inativo</Badge>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKnowledge(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <h4 className="font-medium mb-1">{item.question}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{item.answer}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba Configurações */}
        <TabsContent value="settings" className="space-y-6">
          {/* Área de Testes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧪 Centro de Testes
              </CardTitle>
              <CardDescription>
                Teste todas as APIs e funcionalidades do agente IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={testOpenAI} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  🤖 Testar OpenAI
                </Button>
                <Button 
                  onClick={testFacebook} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  📘 Testar Facebook
                </Button>
                <Button 
                  onClick={testCompleteSystem} 
                  variant="default"
                  className="flex items-center gap-2"
                >
                  🔍 Teste Completo
                </Button>
              </div>
              
              {/* Resultados dos Testes */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Resultados dos Testes:</h4>
                  {testResults.map((result, index) => (
                    <div key={index} className={`
                      p-3 rounded-lg border
                      ${result.status === 'success' ? 'bg-green-50 border-green-200' : 
                        result.status === 'error' ? 'bg-red-50 border-red-200' : 
                        'bg-blue-50 border-blue-200'}
                    `}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.service}</span>
                        <Badge variant={result.status === 'success' ? 'default' : 
                                     result.status === 'error' ? 'destructive' : 'secondary'}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Ver detalhes
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Helper para Token da Página Facebook */}
              {testResults.some(r => r.service === 'Facebook' && r.status === 'success' && r.details?.token_type === 'user') && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium mb-2 text-amber-800">
                    📘 Helper: Como obter o Token da Página
                  </h4>
                  <p className="text-sm text-amber-700 mb-3">
                    Você está usando um token de usuário. Para o bot funcionar, precisa do token específico da página.
                  </p>
                  
                  {/* Mostrar páginas disponíveis */}
                  {testResults.find(r => r.service === 'Facebook')?.details?.accessible_pages && (
                    <div className="mb-4">
                      <h5 className="font-medium text-amber-800 mb-2">Páginas disponíveis:</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {testResults.find(r => r.service === 'Facebook')?.details?.accessible_pages.map((page: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white border rounded text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <strong>{page.name}</strong>
                                <p className="text-muted-foreground">{page.category}</p>
                                <p className="text-muted-foreground">ID: {page.id}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(page.access_token);
                                  toast.success(`Token da página "${page.name}" copiado!`);
                                  // Atualizar automaticamente o campo
                                  setSettings(prev => ({...prev, facebook_page_token: page.access_token}));
                                }}
                              >
                                Usar Esta Página
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-amber-800">Método 1 (Recomendado): Usar páginas acima</strong>
                      <p className="text-amber-700">
                        Clique em "Usar Esta Página" na página desejada. O token será automaticamente copiado.
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-amber-800">Método 2: Facebook Graph Explorer</strong>
                      <ol className="list-decimal list-inside text-amber-700 space-y-1 ml-2">
                        <li>Acesse <a href="https://developers.facebook.com/tools/explorer/" target="_blank" className="text-blue-600 underline">Facebook Graph Explorer</a></li>
                        <li>Selecione sua aplicação no dropdown</li>
                        <li>Em "User or Page", selecione a página desejada</li>
                        <li>Clique em "Generate Access Token"</li>
                        <li>Marque as permissões: <code>pages_messaging</code>, <code>pages_manage_metadata</code></li>
                        <li>Copie o token gerado</li>
                      </ol>
                    </div>
                    
                    <div className="p-2 bg-amber-100 rounded">
                      <strong className="text-amber-800">⚠️ Importante:</strong>
                      <p className="text-amber-700">
                        O token deve ter a permissão <code>pages_messaging</code> para o bot responder mensagens.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Helper para configurar Webhook do Facebook */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">
                  🔧 Configuração do Webhook Facebook
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Para o bot responder automaticamente, você precisa configurar o webhook no Facebook:
                </p>
                
                <div className="space-y-4">
                  <div className="p-3 bg-white border rounded">
                    <h5 className="font-medium text-blue-800 mb-2">1. URL do Webhook</h5>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 p-2 rounded flex-1">
                        https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook');
                          toast.success('URL do webhook copiada!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white border rounded">
                    <h5 className="font-medium text-blue-800 mb-2">2. Verify Token</h5>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 p-2 rounded flex-1">
                        minha_superloja_webhook_token_2024
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText('minha_superloja_webhook_token_2024');
                          toast.success('Verify token copiado!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white border rounded">
                    <h5 className="font-medium text-blue-800 mb-2">3. Configurar no Facebook</h5>
                    <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                      <li>Acesse <a href="https://developers.facebook.com/" target="_blank" className="text-blue-600 underline">Facebook Developers</a></li>
                      <li>Vá para sua aplicação → Produtos → Messenger → Configurações</li>
                      <li>Na seção "Webhooks", clique em "Configurar Webhooks"</li>
                      <li>Cole a URL do webhook acima</li>
                      <li>Cole o Verify Token acima</li>
                      <li>Selecione os eventos: <code>messages</code>, <code>messaging_postbacks</code></li>
                      <li>Clique em "Verificar e Salvar"</li>
                      <li>Depois, associe o webhook à sua página</li>
                    </ol>
                  </div>
                  
                  <div className="p-3 bg-amber-100 border border-amber-300 rounded">
                    <h5 className="font-medium text-amber-800 mb-2">⚠️ Verificações Importantes</h5>
                    <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                      <li>Certifique-se que o token da página tem permissão <code>pages_messaging</code></li>
                      <li>A página deve estar em modo "Desenvolvedor" ou "Ativo"</li>
                      <li>O webhook deve estar associado especificamente à sua página</li>
                      <li>Teste mandando uma mensagem para a página após a configuração</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://developers.facebook.com/', '_blank')}
                    >
                      Abrir Facebook Developers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testWebhook}
                    >
                      Testar Webhook
                    </Button>
                    <Button
                      variant="default" 
                      size="sm"
                      onClick={async () => {
                        toast.loading('Verificando mensagens recentes...');
                        
                        try {
                          console.log('🔍 Carregando conversas...');
                          await loadConversations();
                          
                          // Também verificar se há mensagens no banco
                          const { data: messages, error } = await (supabase as any)
                            .from('ai_conversations')
                            .select('*')
                            .order('timestamp', { ascending: false })
                            .limit(5);
                          
                          console.log('📝 Mensagens encontradas:', messages);
                          
                          if (error) {
                            console.error('❌ Erro ao buscar mensagens:', error);
                            toast.dismiss();
                            toast.error('Erro ao buscar mensagens');
                            return;
                          }
                          
                          if (!messages || messages.length === 0) {
                            toast.dismiss();
                            toast.warning('📭 Nenhuma mensagem encontrada. Envie uma mensagem na página do Facebook primeiro!');
                          } else {
                            toast.dismiss();
                            toast.success(`✅ ${messages.length} mensagem(s) encontrada(s)! Verifique a aba "Conversas"`);
                          }
                          
                        } catch (error) {
                          console.error('❌ Erro ao verificar mensagens:', error);
                          toast.dismiss();
                          toast.error('Erro ao verificar mensagens');
                        }
                      }}
                    >
                      🔍 Verificar Mensagens
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        toast.loading('Sincronizando tokens...');
                        
                        try {
                          // Sincronizar tokens nos secrets
                          await syncWithSecrets();
                          
                          toast.dismiss();
                          toast.success('🔄 Tokens sincronizados! Agora teste enviar uma mensagem.');
                        } catch (error) {
                          console.error('❌ Erro na sincronização:', error);
                          toast.dismiss();
                          toast.error('Erro ao sincronizar tokens');
                        }
                      }}
                    >
                      🔄 Sincronizar Tokens
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!settings.facebook_page_token) {
                          toast.error('Configure o token da página primeiro');
                          return;
                        }

                        toast.loading('Configurando subscrição webhook...');
                        
                        try {
                          const { data, error } = await supabase.functions.invoke('configure-facebook-webhook', {
                            body: {
                              page_token: settings.facebook_page_token,
                              page_id: '230190170178019' // ID da página Superloja
                            }
                          });

                          if (error) throw error;

                          console.log('🔧 Resultado configuração:', data);
                          
                          toast.dismiss();
                          
                          if (data.success) {
                            toast.success('✅ Webhook configurado! Agora teste enviando uma mensagem.');
                          } else {
                            toast.error(`❌ Erro: ${data.error}`);
                          }
                          
                        } catch (error: any) {
                          console.error('❌ Erro ao configurar:', error);
                          toast.dismiss();
                          toast.error(`Erro: ${error.message}`);
                        }
                      }}
                    >
                      🔧 Configurar Subscrição
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da IA
              </CardTitle>
              <CardDescription>
                Configure APIs, modelo preferido e comportamento do bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modelo OpenAI */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Modelo OpenAI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred-model">Modelo Preferido</Label>
                    <select
                      id="preferred-model"
                      className="w-full p-2 border rounded-md"
                      value={settings.preferred_model || 'gpt-4o-mini'}
                      onChange={(e) => setSettings(prev => ({...prev, preferred_model: e.target.value}))}
                    >
                      <option value="gpt-4.1-2025-04-14">GPT-4.1 (Flagship) - Mais Poderoso</option>
                      <option value="gpt-4o-mini">GPT-4o Mini - Rápido e Econômico</option>
                      <option value="o3-2025-04-16">O3 - Raciocínio Avançado</option>
                      <option value="o4-mini-2025-04-16">O4 Mini - Raciocínio Rápido</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      GPT-4o Mini é recomendado para chatbot por ser rápido e econômico
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">Chave API OpenAI</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      value={settings.openai_api_key || ''}
                      onChange={(e) => setSettings(prev => ({...prev, openai_api_key: e.target.value}))}
                      placeholder="sk-..."
                    />
                    <p className="text-sm text-muted-foreground">
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        → Obter chave API OpenAI
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Facebook Integration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Integração Facebook</h3>
                <div className="space-y-2">
                  <Label htmlFor="facebook-token">Token Página Facebook</Label>
                  <Input
                    id="facebook-token"
                    type="password"
                    value={settings.facebook_page_token || ''}
                    onChange={(e) => setSettings(prev => ({...prev, facebook_page_token: e.target.value}))}
                    placeholder="EAA..."
                  />
                  <p className="text-sm text-muted-foreground">
                    <a 
                      href="https://developers.facebook.com/tools/explorer/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      → Obter token Facebook
                    </a>
                  </p>
                </div>
              </div>

              {/* Bot Behavior */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Comportamento do Bot</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="response-tone">Tom das Respostas</Label>
                    <select
                      id="response-tone"
                      className="w-full p-2 border rounded-md"
                      value={settings.response_tone || 'amigavel'}
                      onChange={(e) => setSettings(prev => ({...prev, response_tone: e.target.value}))}
                    >
                      <option value="profissional">Profissional</option>
                      <option value="amigavel">Amigável</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="max-response">Tamanho Máximo</Label>
                    <Input
                      id="max-response"
                      type="number"
                      min="50"
                      max="500"
                      value={settings.max_response_length || 200}
                      onChange={(e) => setSettings(prev => ({...prev, max_response_length: parseInt(e.target.value)}))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="auto-response"
                      checked={settings.auto_response_enabled === 'true'}
                      onCheckedChange={(checked) => setSettings(prev => ({...prev, auto_response_enabled: checked.toString()}))}
                    />
                    <Label htmlFor="auto-response">Respostas Automáticas</Label>
                  </div>
                </div>
              </div>

              {/* Sincronização */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sincronização</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={syncWithSecrets} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    🔄 Sincronizar com Secrets
                  </Button>
                  <Button 
                    onClick={testTables} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    🔍 Verificar Tabelas
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  A sincronização copia as chaves para os secrets do Supabase automaticamente
                </p>
              </div>

              {/* Quick Setup Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Links Úteis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Webhook Facebook</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      URL para configurar no Facebook
                    </p>
                    <code className="text-xs bg-muted p-1 rounded block mb-2">
                      https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook
                    </code>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigator.clipboard.writeText('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook')}
                    >
                      📋 Copiar URL
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Facebook Developers</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure seu app Facebook
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('https://developers.facebook.com/', '_blank')}
                    >
                      Abrir Console
                    </Button>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">OpenAI Platform</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Gerencie suas chaves API
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('https://platform.openai.com/', '_blank')}
                    >
                      Acessar
                    </Button>
                  </Card>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveSettings} 
                  className="flex-1" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    '💾 Salvar Configurações'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
