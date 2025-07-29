import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, TrendingUp, Settings, Eye, Plus, Edit, Trash2, RefreshCw, Send } from 'lucide-react';
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
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

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
  instagram_page_token: string;
  instagram_bot_enabled: boolean;
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
  // Hook para mensagens em tempo real
  const {
    messages: realtimeMessages,
    isLoading: realtimeLoading,
    lastUpdate,
    sendTestMessage,
    refreshMessages,
    messageCount
  } = useRealtimeMessages();

  const [metrics, setMetrics] = useState<AIMetric | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [learningInsights, setLearningInsights] = useState<any[]>([]);
  const [conversationPatterns, setConversationPatterns] = useState<any[]>([]);
  
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
    instagram_page_token: '',
    instagram_bot_enabled: false,
    bot_enabled: true,
    max_response_length: 200,
    fallback_to_human: true,
    response_tone: '',
    auto_response_enabled: '',
    preferred_model: 'gpt-4o-mini'
  });

  const [adminSettings, setAdminSettings] = useState({
    admin_facebook_id: 'carlosfox',
    escalation_enabled: 'true',
    escalation_keywords: 'comprar,finalizar,problema,ajuda,atendente'
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadLearningData();
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

  const loadLearningData = async () => {
    try {
      // Carregar insights de aprendizado
      const { data: insights, error: insightsError } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (insightsError) {
        console.error('Erro ao carregar insights:', insightsError);
      } else {
        setLearningInsights(insights || []);
      }

      // Carregar padrões de conversa
      const { data: patterns, error: patternsError } = await supabase
        .from('ai_conversation_patterns')
        .select('*')
        .eq('is_active', true)
        .order('success_rate', { ascending: false })
        .limit(15);

      if (patternsError) {
        console.error('Erro ao carregar padrões:', patternsError);
      } else {
        setConversationPatterns(patterns || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
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
      instagram_page_token: '',
      instagram_bot_enabled: 'false',
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
    
    // Carregar configurações do admin também
    const adminObj: any = {
      admin_facebook_id: 'carlosfox',
      escalation_enabled: 'true',
      escalation_keywords: 'comprar,finalizar,problema,ajuda,atendente'
    };
    
    data?.forEach(setting => {
      if (setting.key.startsWith('admin_')) {
        adminObj[setting.key] = setting.value || '';
      }
    });
    
    setAdminSettings(adminObj);
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

  const syncMetaToken = async () => {
    const toastId = toast.loading('Sincronizando token das configurações Meta...');
    
    try {
      console.log('🔄 Sincronizando token Meta...');
      
      const { data, error } = await supabase.functions.invoke('sync-meta-token');

      console.log('📤 Resposta sync Meta:', { data, error });

      if (error) {
        console.error('❌ Erro sync Meta:', error);
        
        // Tentar extrair mensagem mais específica do erro
        let errorMessage = error.message || 'Falha na sincronização';
        
        // Se for um erro de função edge com status específico, tentar obter detalhes
        if (error.message?.includes('non-2xx status code')) {
          try {
            // Tentar fazer uma nova chamada para obter a resposta detalhada
            const response = await fetch(`https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/sync-meta-token`, {
              method: 'POST',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE',
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              const errorDetails = await response.json();
              errorMessage = errorDetails.error || errorDetails.message || errorMessage;
            }
          } catch (fetchError) {
            console.log('Não foi possível obter detalhes do erro');
          }
        }
        
        toast.dismiss(toastId);
        toast.error(`❌ ${errorMessage}`);
        return;
      }
      
      toast.dismiss(toastId);
      toast.success('✅ Token Meta sincronizado com sucesso!');
      console.log('✅ Sync Meta completo:', data);
      
      // Recarregar configurações
      await loadSettings();
      
    } catch (error: any) {
      console.error('💥 Erro sync Meta:', error);
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


  const testInstagram = async () => {
    const testResult: TestResult = {
      service: 'Instagram',
      status: 'testing',
      message: 'Testando webhook Instagram...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram'), testResult]);
    
    try {
      console.log('🧪 Testando Instagram...');
      
      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      let message = '';
      let status: 'success' | 'error' = 'success';
      
      if (response.ok) {
        const text = await response.text();
        if (text.includes('funcionando')) {
          message = '✅ Webhook Instagram funcionando corretamente!';
        } else {
          message = '✅ Instagram webhook respondendo';
        }
      } else if (response.status === 403) {
        message = '✅ Webhook funcionando (403 é esperado para teste direto)';
      } else {
        message = `❌ Webhook retornou status: ${response.status}`;
        status = 'error';
      }
      
      const result = {
        service: 'Instagram',
        status,
        message,
        details: { status: response.status, ok: response.ok }
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram'), result]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Instagram',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram'), errorResult]);
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

  const testInstagramDebug = async () => {
    const testResult: TestResult = {
      service: 'Instagram Debug',
      status: 'testing',
      message: 'Testando debug Instagram...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), testResult]);
    
    try {
      // Testar webhook com parâmetros específicos
      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Test': 'true'
        },
        body: JSON.stringify({
          object: 'instagram',
          entry: [{
            id: '123456789',
            time: Date.now(),
            messaging: [{
              sender: { id: 'test_user_123' },
              recipient: { id: '230190170178019' },
              timestamp: Date.now(),
              message: { text: 'teste debug' }
            }]
          }]
        })
      });
      
      let message = '';
      let status: 'success' | 'error' = 'success';
      
      if (response.ok) {
        message = '✅ Debug Instagram executado com sucesso! Verifique os logs.';
      } else {
        message = `❌ Debug falhou com status: ${response.status}`;
        status = 'error';
      }
      
      const result = {
        service: 'Instagram Debug',
        status,
        message,
        details: { status: response.status, timestamp: new Date().toISOString() }
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), result]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Instagram Debug',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), errorResult]);
    }
  };

  const testInstagramToken = async () => {
    if (!settings.instagram_page_token) {
      toast.error('Configure o token Instagram primeiro');
      return;
    }

    const testResult: TestResult = {
      service: 'Instagram Token',
      status: 'testing',
      message: 'Validando token Instagram...'
  };

  const testInstagramDebug = async () => {
    const testResult: TestResult = {
      service: 'Instagram Debug',
      status: 'testing',
      message: 'Testando debug Instagram...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), testResult]);
    
    try {
      // Testar webhook com parâmetros específicos
      const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Test': 'true'
        },
        body: JSON.stringify({
          object: 'instagram',
          entry: [{
            id: '123456789',
            time: Date.now(),
            messaging: [{
              sender: { id: 'test_user_123' },
              recipient: { id: '230190170178019' },
              timestamp: Date.now(),
              message: { text: 'teste debug' }
            }]
          }]
        })
      });
      
      let message = '';
      let status: 'success' | 'error' = 'success';
      
      if (response.ok) {
        message = '✅ Debug Instagram executado com sucesso! Verifique os logs.';
      } else {
        message = `❌ Debug falhou com status: ${response.status}`;
        status = 'error';
      }
      
      const result = {
        service: 'Instagram Debug',
        status,
        message,
        details: { status: response.status, timestamp: new Date().toISOString() }
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), result]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Instagram Debug',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Debug'), errorResult]);
    }
  };

  const testInstagramToken = async () => {
    if (!settings.instagram_page_token) {
      toast.error('Configure o token Instagram primeiro');
      return;
    }

    const testResult: TestResult = {
      service: 'Instagram Token',
      status: 'testing',
      message: 'Validando token Instagram...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), testResult]);
    
    try {
      // Testar token do Instagram via Graph API
      const response = await fetch(`https://graph.instagram.com/me?access_token=${settings.instagram_page_token}`);
      const data = await response.json();
      
      let message = '';
      let status: 'success' | 'error' = 'success';
      
      if (response.ok && data.id) {
        message = `✅ Token Instagram válido! ID: ${data.id}`;
      } else {
        message = `❌ Token Instagram inválido: ${data.error?.message || 'Erro desconhecido'}`;
        status = 'error';
      }
      
      const result = {
        service: 'Instagram Token',
        status,
        message,
        details: data
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), result]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Instagram Token',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), errorResult]);
    }
  };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), testResult]);
    
    try {
      // Testar token do Instagram via Graph API
      const response = await fetch(`https://graph.instagram.com/me?access_token=${settings.instagram_page_token}`);
      const data = await response.json();
      
      let message = '';
      let status: 'success' | 'error' = 'success';
      
      if (response.ok && data.id) {
        message = `✅ Token Instagram válido! ID: ${data.id}`;
      } else {
        message = `❌ Token Instagram inválido: ${data.error?.message || 'Erro desconhecido'}`;
        status = 'error';
      }
      
      const result = {
        service: 'Instagram Token',
        status,
        message,
        details: data
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), result]);
      
    } catch (error: any) {
      const errorResult = {
        service: 'Instagram Token',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Instagram Token'), errorResult]);
    }
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

  const debugFacebookMessaging = async () => {
    const testResult: TestResult = {
      service: 'Debug Facebook',
      status: 'testing',
      message: 'Executando debug completo...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Debug Facebook'), testResult]);
    
    try {
      console.log('🔍 Iniciando debug Facebook Messaging...');
      
      const { data, error } = await supabase.functions.invoke('debug-facebook-messaging');

      console.log('📊 Resultado debug:', { data, error });

      // Tentar extrair informações mesmo com erro
      let debugInfo = null;
      if (error && error.message?.includes('non-2xx status code')) {
        try {
          // Tentar fazer uma nova chamada para obter a resposta detalhada
          const response = await fetch(`https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/debug-facebook-messaging`, {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDY0NzksImV4cCI6MjA2NzI4MjQ3OX0.gmxFrRj6UqY_VIvdZmsst1DdPBpWnWRCBqBKR-PemvE',
              'Content-Type': 'application/json'
            }
          });
          
          debugInfo = await response.json();
          console.log('📋 Debug info extraída:', debugInfo);
          
        } catch (fetchError) {
          console.log('Não foi possível obter detalhes do debug');
        }
      }

      if (error && !debugInfo) {
        console.error('❌ Erro no debug:', error);
        throw error;
      }
      
      const finalData = data || debugInfo;
      const isSuccess = finalData?.success !== false;
      
      const result = {
        service: 'Debug Facebook',
        status: (isSuccess && finalData?.fully_functional) ? 'success' as const : 'error' as const,
        message: isSuccess && finalData?.fully_functional 
          ? '✅ Sistema funcionando perfeitamente!' 
          : `❌ ${finalData?.debug_results?.summary?.issues_found?.length || 'Vários'} problema(s) encontrado(s)`,
        details: finalData,
        timestamp: new Date().toLocaleString()
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Debug Facebook'), result]);
      
      // Mostrar recomendações se houver problemas
      if (!isSuccess || !finalData?.fully_functional) {
        if (finalData?.recommendations?.length > 0) {
          toast.error('Problemas encontrados! Veja os detalhes e recomendações.');
          console.log('📋 Recomendações:', finalData.recommendations);
        } else {
          toast.error(finalData?.error || 'Problemas encontrados no debug');
        }
      } else {
        toast.success('🎉 Sistema funcionando perfeitamente!');
      }
      
    } catch (error: any) {
      const errorResult = {
        service: 'Debug Facebook',
        status: 'error' as const,
        message: `❌ Erro no debug: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Debug Facebook'), errorResult]);
      toast.error('Erro ao executar debug');
    }
  };

  const testFacebookSend = async () => {
    const testResult: TestResult = {
      service: 'Facebook Send',
      status: 'testing',
      message: 'Testando envio real...'
    };
    
    setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook Send'), testResult]);
    
    try {
      console.log('🧪 Testando envio real Facebook...');
      
      // Usar um ID de teste (você pode usar o seu próprio PSID)
      const testRecipientId = '24320548907583618'; // ID que aparece nos logs
      const testMessage = `🧪 Teste de envio - ${new Date().toLocaleTimeString()}`;
      
      const { data, error } = await supabase.functions.invoke('test-facebook-send', {
        body: {
          recipient_id: testRecipientId,
          message: testMessage
        }
      });

      console.log('📤 Resposta teste envio:', { data, error });

      if (error) {
        console.error('❌ Erro teste envio:', error);
        throw error;
      }
      
      const result = {
        service: 'Facebook Send',
        status: data.success ? 'success' as const : 'error' as const,
        message: data.success 
          ? `✅ Mensagem enviada! ID: ${data.details?.message_id}` 
          : `❌ Falha: ${data.error}`,
        details: data,
        timestamp: new Date().toLocaleString()
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook Send'), result]);
      
      if (data.success) {
        toast.success('🎉 Mensagem enviada com sucesso!');
      } else {
        toast.error('❌ Falha no envio: ' + data.error);
      }
      
    } catch (error: any) {
      const errorResult = {
        service: 'Facebook Send',
        status: 'error' as const,
        message: `❌ Erro: ${error.message}`,
        details: error
      };
      
      setTestResults(prev => [...prev.filter(r => r.service !== 'Facebook Send'), errorResult]);
      toast.error('Erro ao testar envio');
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

  // Carregar insights de aprendizado
  const loadLearningInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar insights:', error);
        return;
      }

      setLearningInsights(data || []);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  // Carregar padrões de conversas
  const loadConversationPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversation_patterns')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        console.error('Erro ao carregar padrões:', error);
        return;
      }

      setConversationPatterns(data || []);
    } catch (error) {
      console.error('Erro ao carregar padrões:', error);
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

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">🔴 Tempo Real</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
          <TabsTrigger value="learning">📚 Aprendizado</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Nova Aba - Monitoramento em Tempo Real */}
        <TabsContent value="realtime">
          <div className="grid gap-4">
            {/* Status de Conexão */}
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
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={refreshMessages}
                    disabled={realtimeLoading}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${realtimeLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  
                  <div className="flex gap-2 flex-1 max-w-md">
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
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Lista de Mensagens em Tempo Real */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {realtimeMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem ainda.</p>
                      <p className="text-sm">As mensagens aparecerão aqui automaticamente.</p>
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
          </div>
        </TabsContent>

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

        {/* Aba Aprendizado */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid gap-6">
            {/* Insights de Aprendizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 Insights de Aprendizado
                </CardTitle>
                <CardDescription>
                  Padrões identificados e melhorias sugeridas pelo sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningInsights.length > 0 ? (
                    learningInsights.map((insight, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.category}</h4>
                          <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.insight}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confiança: {(insight.confidence * 100).toFixed(0)}%</span>
                          <span>Impacto: {insight.impact}</span>
                          <span>Identificado em: {new Date(insight.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum insight disponível ainda.</p>
                      <p className="text-sm">O sistema aprenderá com as interações e gerará insights automaticamente.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Padrões de Conversação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Padrões de Conversação
                </CardTitle>
                <CardDescription>
                  Análise de tendências e comportamentos dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conversationPatterns.length > 0 ? (
                    conversationPatterns.map((pattern, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{pattern.pattern_type}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{pattern.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Frequência: {pattern.frequency}</span>
                          <Badge variant="outline">{pattern.trend}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Coletando dados de padrões...</p>
                      <p className="text-sm">Os padrões aparecerão conforme mais conversas forem processadas.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sugestões de Melhoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💡 Sugestões de Melhoria
                </CardTitle>
                <CardDescription>
                  Recomendações baseadas na análise de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📈 Otimização de Respostas
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Adicione mais variações de respostas para perguntas frequentes para tornar as conversas mais naturais.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      🎯 Personalização
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Implemente respostas personalizadas baseadas no histórico de cada usuário.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      ⚡ Performance
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Otimize o tempo de resposta implementando cache para respostas frequentes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  onClick={debugFacebookMessaging} 
                  variant="outline"
                  className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  🔍 Debug Mensagens
                </Button>
                <Button 
                  onClick={testFacebookSend} 
                  variant="outline"
                  className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
                >
                  📤 Teste Envio Real
                </Button>
                <Button 
                  onClick={testCompleteSystem} 
                  variant="default"
                  className="flex items-center gap-2"
                >
                  🔍 Teste Completo
                </Button>
                <Button 
                  onClick={testInstagram} 
                  variant="outline"
                  className="flex items-center gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  📸 Testar Instagram
                </Button>
                <Button 
                  onClick={testInstagram} 
                  variant="outline"
                  className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  🔑 Validar Token
                </Button>
                <Button 
                  onClick={testInstagram} 
                  variant="outline"
                  className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                >
                  🐛 Debug Completo
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        toast.loading('Testando sistema completo...');
                        
                        try {
                          console.log('🧪 Iniciando teste do sistema...');
                          
                          // 1. Testar banco de dados diretamente
                          const testMessage = {
                            platform: 'facebook',
                            user_id: 'test_user_123',
                            message: 'Mensagem de teste do sistema',
                            type: 'received',
                            timestamp: new Date().toISOString()
                          };

                          console.log('📝 Testando inserção no banco...');
                          const { data: insertData, error: insertError } = await (supabase as any)
                            .from('ai_conversations')
                            .insert(testMessage)
                            .select();

                          if (insertError) {
                            console.error('❌ Erro inserção:', insertError);
                            throw new Error(`Banco de dados: ${insertError.message}`);
                          }

                          console.log('✅ Mensagem inserida:', insertData);

                          // 2. Testar leitura do banco
                          const { data: messages, error: readError } = await (supabase as any)
                            .from('ai_conversations')
                            .select('*')
                            .order('timestamp', { ascending: false })
                            .limit(10);

                          if (readError) {
                            console.error('❌ Erro leitura:', readError);
                            throw new Error(`Leitura: ${readError.message}`);
                          }

                          console.log('📋 Mensagens encontradas:', messages);

                          // 3. Recarregar conversas na interface
                          await loadConversations();

                          toast.dismiss();
                          
                          if (messages && messages.length > 0) {
                            toast.success(`✅ Sistema funcionando! ${messages.length} mensagem(s) no banco. Verifique aba "Conversas"`);
                          } else {
                            toast.warning('⚠️ Sistema funciona mas não há mensagens. Problema pode ser configuração Facebook.');
                          }
                          
                        } catch (error: any) {
                          console.error('❌ Erro no teste:', error);
                          toast.dismiss();
                          toast.error(`❌ Erro: ${error.message}`);
                        }
                      }}
                    >
                      🧪 Testar Sistema
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        toast.loading('Testando webhook...');
                        
                        try {
                          // Simular mensagem do Facebook
                          const webhookData = {
                            entry: [{
                              id: '230190170178019',
                              time: Date.now(),
                              messaging: [{
                                sender: { id: 'test_user_webhook' },
                                recipient: { id: '230190170178019' },
                                timestamp: Date.now(),
                                message: {
                                  mid: 'test_msg_' + Date.now(),
                                  text: 'Teste webhook direto'
                                }
                              }]
                            }]
                          };

                          console.log('🔄 Enviando para webhook...', webhookData);

                          const response = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'User-Agent': 'facebookplatform/1.0 (+http://www.facebook.com/)'
                            },
                            body: JSON.stringify(webhookData)
                          });

                          const result = await response.text();
                          console.log('📤 Resposta webhook:', response.status, result);

                          // Verificar se mensagem apareceu no banco
                          setTimeout(async () => {
                            await loadConversations();
                            const { data: messages } = await (supabase as any)
                              .from('ai_conversations')
                              .select('*')
                              .eq('user_id', 'test_user_webhook')
                              .order('timestamp', { ascending: false })
                              .limit(1);

                            toast.dismiss();

                            if (messages && messages.length > 0) {
                              toast.success('✅ Webhook funcionando! Mensagem processada.');
                            } else {
                              toast.error('❌ Webhook não processou mensagem. Verifique logs.');
                            }
                          }, 2000);

                        } catch (error: any) {
                          console.error('❌ Erro webhook:', error);
                          toast.dismiss();
                          toast.error(`Erro webhook: ${error.message}`);
                        }
                      }}
                    >
                      📡 Testar Webhook
                    </Button>
                  </div>
                  
                  {/* Guia de configuração Facebook */}
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-3">🔧 Sistema funcionando! Configuração Facebook necessária:</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">1</span>
                        <div>
                          <p className="font-medium">Verificar Aplicação Facebook</p>
                          <p className="text-gray-600">Acesse Facebook Developer Console → Sua App → Status da Revisão</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
                            className="mt-1"
                          >
                            Abrir Facebook Apps
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">2</span>
                        <div>
                          <p className="font-medium">Configurar Webhooks na App</p>
                          <p className="text-gray-600">Produtos → Messenger → Configurações → Webhooks</p>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                            <p><strong>URL:</strong> https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook</p>
                            <p><strong>Token:</strong> minha_superloja_webhook_token_2024</p>
                            <p><strong>Campos:</strong> messages, messaging_postbacks</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">3</span>
                        <div>
                          <p className="font-medium">Adicionar Página aos Webhooks</p>
                          <p className="text-gray-600">Webhooks → Subscrições → Adicionar página Superloja</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">4</span>
                        <div>
                          <p className="font-medium">Solicitar Permissões</p>
                          <p className="text-gray-600">App Review → Solicitar pages_messaging permission</p>
                        </div>
                       </div>
                     </div>
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

              {/* Instagram Integration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Integração Instagram</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="instagram-bot-enabled"
                      checked={!!(settings.instagram_bot_enabled)}
                      onCheckedChange={(checked) => setSettings(prev => ({...prev, instagram_bot_enabled: checked}))}
                    />
                    <Label htmlFor="instagram-bot-enabled">Habilitar Bot Instagram</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram-token">Token Página Instagram</Label>
                    <Input
                      id="instagram-token"
                      type="password"
                      value={settings.instagram_page_token || ''}
                      onChange={(e) => setSettings(prev => ({...prev, instagram_page_token: e.target.value}))}
                      placeholder="EAA... (mesmo token do Facebook)"
                    />
                    <p className="text-sm text-muted-foreground">
                      💡 Use o mesmo token do Facebook se sua página está conectada ao Instagram
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🔗 Configuração do Webhook Instagram</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>URL do Webhook:</strong>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-white p-2 rounded border flex-1">
                            https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/instagram-webhook');
                              toast.success('URL do webhook Instagram copiada!');
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <strong>Verify Token:</strong>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-white p-2 rounded border flex-1">
                            minha_superloja_instagram_webhook_token_2024
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText('minha_superloja_instagram_webhook_token_2024');
                              toast.success('Token de verificação Instagram copiado!');
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-blue-700 text-sm">
                        <strong>Como configurar:</strong>
                      </p>
                      <ol className="list-decimal list-inside text-blue-600 text-sm space-y-1 mt-1">
                        <li>Acesse <a href="https://developers.facebook.com/" target="_blank" className="underline">Facebook Developers</a></li>
                        <li>Vá para sua aplicação → Produtos → Messenger → Configurações</li>
                        <li>Configure também o webhook para Instagram na mesma aplicação</li>
                        <li>Certifique-se que a página Instagram está conectada à página Facebook</li>
                      </ol>
                    </div>
                  </div>
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

              {/* Configurações de Escalation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Escalation para Humano</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="escalation-enabled"
                      checked={adminSettings.escalation_enabled === 'true'}
                      onCheckedChange={(checked) => setAdminSettings(prev => ({...prev, escalation_enabled: checked.toString()}))}
                    />
                    <Label htmlFor="escalation-enabled">Habilitar Escalation Automático</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-facebook-id">ID Facebook do Admin (carlosfox)</Label>
                    <Input
                      id="admin-facebook-id"
                      value={adminSettings.admin_facebook_id || ''}
                      onChange={(e) => setAdminSettings(prev => ({...prev, admin_facebook_id: e.target.value}))}
                      placeholder="carlosfox ou ID numérico"
                    />
                    <p className="text-sm text-muted-foreground">
                      Este usuário receberá notificações quando clientes quiserem finalizar compras
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="escalation-keywords">Palavras-chave para Escalation</Label>
                    <Textarea
                      id="escalation-keywords"
                      value={adminSettings.escalation_keywords || ''}
                      onChange={(e) => setAdminSettings(prev => ({...prev, escalation_keywords: e.target.value}))}
                      placeholder="comprar,finalizar,problema,ajuda,atendente"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Separar palavras-chave por vírgula. Quando detectadas, admin será notificado.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🔔 Como Funciona o Escalation</h4>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      <li>Cliente menciona palavras como "comprar", "finalizar compra"</li>
                      <li>IA não consegue responder adequadamente</li>
                      <li>Cliente demonstra frustração ou faz perguntas repetidas</li>
                      <li>Admin recebe mensagem automática no Facebook com detalhes</li>
                      <li>Admin pode assumir o atendimento manualmente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sincronização */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sincronização</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={syncWithSecrets} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    🔄 Sincronizar com Secrets
                  </Button>
                  <Button 
                    onClick={syncMetaToken} 
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={!settings.facebook_page_token}
                  >
                    🔗 Usar Token Meta
                  </Button>
                  {!settings.facebook_page_token && (
                    <p className="text-sm text-muted-foreground ml-2">
                      ⚠️ Configure primeiro o token Facebook acima para usar esta função
                    </p>
                  )}
                  <Button 
                    onClick={testTables} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    🔍 Verificar Tabelas
                  </Button>
                 </div>
                 <p className="text-sm text-muted-foreground">
                   💡 Use "Usar Token Meta" para sincronizar o token que você salvou na página de configurações Meta/Facebook
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

        {/* Aba de Aprendizado */}
        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights de Aprendizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Insights de Aprendizado
                </CardTitle>
                <CardDescription>
                  Conhecimento que o agente adquiriu através das conversas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {learningInsights.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum insight de aprendizado ainda
                    </p>
                  ) : (
                    learningInsights.map((insight, index) => (
                      <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{insight.insight_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{insight.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Confiança: {(insight.confidence_score * 100).toFixed(0)}%</span>
                          <span>Efetividade: {(insight.effectiveness_score * 100).toFixed(0)}%</span>
                          <span>Usado {insight.usage_count}x</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Padrões de Conversa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Padrões de Conversa
                </CardTitle>
                <CardDescription>
                  Padrões de resposta que o agente aprendeu a usar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversationPatterns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum padrão de conversa ainda
                    </p>
                  ) : (
                    conversationPatterns.map((pattern, index) => (
                      <div key={pattern.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{pattern.pattern_name}</h4>
                          <Badge variant={pattern.is_active ? 'default' : 'secondary'}>
                            {pattern.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pattern.response_template}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Prioridade: {pattern.priority}</span>
                          <span>Taxa de sucesso: {(pattern.success_rate * 100).toFixed(0)}%</span>
                          <span>Usado {pattern.usage_count}x</span>
                        </div>
                        {pattern.trigger_keywords && pattern.trigger_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pattern.trigger_keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={loadLearningData}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Dados de Aprendizado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Estatísticas de Aprendizado */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Aprendizado</CardTitle>
              <CardDescription>
                Resumo do conhecimento acumulado pelo agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {learningInsights.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Insights Totais
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {conversationPatterns.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Padrões Aprendidos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {learningInsights.reduce((acc, insight) => acc + insight.usage_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Aplicações do Conhecimento
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {learningInsights.length > 0 
                      ? ((learningInsights.reduce((acc, insight) => acc + insight.effectiveness_score, 0) / learningInsights.length) * 100).toFixed(0)
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Efetividade Média
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
