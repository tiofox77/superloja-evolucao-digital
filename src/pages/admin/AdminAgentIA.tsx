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
    auto_response_enabled: ''
  });

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
      // Se as tabelas não existem ainda, manter valores padrão
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
      auto_response_enabled: 'true'
    };
    
    // Sobrescrever com dados do banco
    data?.forEach(setting => {
      settingsObj[setting.key] = setting.value || '';
    });
    
    console.log('Settings processados:', settingsObj);
    
    // Forçar atualização completa do estado
    setSettings(settingsObj);
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da IA
              </CardTitle>
              <CardDescription>
                Configure APIs e comportamento do bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Migration Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-600">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Primeiro Uso do Agente IA</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Para usar o Agente IA, primeiro execute a migração das tabelas no Supabase.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('/ai-agent-migration.sql', '_blank')}
                    >
                      📄 Ver SQL
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('/migrate-ai-tables.html', '_blank')}
                    >
                      🚀 Executar Migração
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={testTables}
                    >
                      🔍 Testar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        try {
                          const { data } = await (supabase as any)
                            .from('ai_settings')
                            .select('*')
                            .order('key');
                          console.log('Dados atuais no banco:', data);
                          toast.success(`📊 ${data?.length || 0} configurações no banco`);
                        } catch (error) {
                          toast.error('❌ Erro ao verificar banco');
                        }
                      }}
                    >
                      📊 Ver Banco
                    </Button>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">APIs Necessárias</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Bot Behavior */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Comportamento do Bot</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-response"
                      checked={settings.auto_response_enabled === 'true'}
                      onCheckedChange={(checked) => setSettings(prev => ({...prev, auto_response_enabled: checked.toString()}))}
                    />
                    <Label htmlFor="auto-response">Respostas Automáticas</Label>
                  </div>
                </div>
              </div>

              {/* Quick Setup Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Links Úteis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Guia Completo</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Instruções detalhadas de setup
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open('/GUIA_CONFIGURACAO_APIS.md', '_blank')}
                    >
                      Ver Guia
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
              
              <Button 
                onClick={handleSaveSettings} 
                className="w-full" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
