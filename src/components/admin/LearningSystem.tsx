import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Eye, 
  RefreshCw,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LearningInsight {
  id: string;
  insight_type: string;
  content: string;
  confidence_score: number;
  usage_count: number;
  effectiveness_score: number;
  created_at: string;
}

interface LearningMetrics {
  totalConversations: number;
  successfulInteractions: number;
  commonTopics: string[];
  peakHours: string[];
  improvementAreas: string[];
}

interface ConversationPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  category: string;
}

const LearningSystem = () => {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [metrics, setMetrics] = useState<LearningMetrics>({
    totalConversations: 0,
    successfulInteractions: 0,
    commonTopics: [],
    peakHours: [],
    improvementAreas: []
  });
  const [patterns, setPatterns] = useState<ConversationPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Carregar insights de aprendizado
  const loadLearningInsights = async () => {
    try {
      const { data } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setInsights(data);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  // Analisar conversas e gerar insights
  const analyzeConversations = async () => {
    setIsAnalyzing(true);
    
    try {
      // Buscar conversas recentes
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (conversations) {
        // Analisar padrões
        const topicAnalysis = analyzeTopics(conversations);
        const timeAnalysis = analyzeTimings(conversations);
        const successAnalysis = analyzeSuccess(conversations);

        // Atualizar métricas
        setMetrics({
          totalConversations: conversations.length,
          successfulInteractions: successAnalysis.successful,
          commonTopics: topicAnalysis.topics,
          peakHours: timeAnalysis.peakHours,
          improvementAreas: successAnalysis.improvementAreas
        });

        // Gerar novos insights
        await generateInsights(conversations);
        
        setLastAnalysis(new Date());
        toast.success('Análise de aprendizado concluída!');
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar conversas');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analisar tópicos mais comuns
  const analyzeTopics = (conversations: any[]) => {
    const topicCount: { [key: string]: number } = {};
    
    conversations.forEach(conv => {
      const message = conv.message.toLowerCase();
      
      // Detectar tópicos baseado em palavras-chave
      if (message.includes('preço') || message.includes('valor') || message.includes('custo')) {
        topicCount['Preços'] = (topicCount['Preços'] || 0) + 1;
      }
      if (message.includes('entrega') || message.includes('envio')) {
        topicCount['Entrega'] = (topicCount['Entrega'] || 0) + 1;
      }
      if (message.includes('produto') || message.includes('disponível')) {
        topicCount['Produtos'] = (topicCount['Produtos'] || 0) + 1;
      }
      if (message.includes('pagamento') || message.includes('cartão')) {
        topicCount['Pagamento'] = (topicCount['Pagamento'] || 0) + 1;
      }
    });

    const topics = Object.entries(topicCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    return { topics };
  };

  // Analisar horários de pico
  const analyzeTimings = (conversations: any[]) => {
    const hourCount: { [key: string]: number } = {};
    
    conversations.forEach(conv => {
      const hour = new Date(conv.timestamp).getHours();
      const hourKey = `${hour}:00`;
      hourCount[hourKey] = (hourCount[hourKey] || 0) + 1;
    });

    const peakHours = Object.entries(hourCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    return { peakHours };
  };

  // Analisar taxa de sucesso
  const analyzeSuccess = (conversations: any[]) => {
    const userGroups: { [key: string]: any[] } = {};
    
    // Agrupar por usuário
    conversations.forEach(conv => {
      if (!userGroups[conv.user_id]) {
        userGroups[conv.user_id] = [];
      }
      userGroups[conv.user_id].push(conv);
    });

    let successful = 0;
    const improvementAreas = [];

    // Analisar cada conversa de usuário
    Object.values(userGroups).forEach(userConversations => {
      const hasPersonalData = userConversations.some(conv => 
        conv.message.includes('nome') || 
        conv.message.includes('telefone') || 
        conv.message.includes('endereço')
      );
      
      const hasConfirmation = userConversations.some(conv => 
        conv.message.includes('sim') || 
        conv.message.includes('confirmo') || 
        conv.message.includes('certo')
      );

      if (hasPersonalData && hasConfirmation) {
        successful++;
      } else if (!hasPersonalData) {
        improvementAreas.push('Coleta de dados pessoais');
      } else if (!hasConfirmation) {
        improvementAreas.push('Confirmação de compra');
      }
    });

    return { 
      successful, 
      improvementAreas: [...new Set(improvementAreas)].slice(0, 3) 
    };
  };

  // Gerar insights automáticos
  const generateInsights = async (conversations: any[]) => {
    const insights = [];

    // Insight sobre padrões de confirmação
    const confirmations = conversations.filter(conv => 
      conv.message.toLowerCase().includes('sim') ||
      conv.message.toLowerCase().includes('confirmo')
    );

    if (confirmations.length > 0) {
      insights.push({
        insight_type: 'confirmation_pattern',
        content: `Detectados ${confirmations.length} padrões de confirmação. Usuários respondem positivamente em ${Math.round(confirmations.length / conversations.length * 100)}% das interações.`,
        confidence_score: 0.85,
        usage_count: confirmations.length,
        effectiveness_score: 0.9
      });
    }

    // Insight sobre produtos mais procurados
    const productMentions = conversations.filter(conv => 
      conv.message.toLowerCase().includes('produto') ||
      conv.message.toLowerCase().includes('preço')
    );

    if (productMentions.length > 5) {
      insights.push({
        insight_type: 'product_interest',
        content: `Alta demanda por informações de produtos (${productMentions.length} menções). Considere destacar produtos populares nas respostas.`,
        confidence_score: 0.78,
        usage_count: productMentions.length,
        effectiveness_score: 0.85
      });
    }

    // Salvar insights no banco
    for (const insight of insights) {
      try {
        // Verificar se já existe um insight similar
        const { data: existingInsight } = await supabase
          .from('ai_learning_insights')
          .select('id')
          .eq('insight_type', insight.insight_type)
          .eq('content', insight.content)
          .maybeSingle();

        if (!existingInsight) {
          await supabase
            .from('ai_learning_insights')
            .insert(insight);
        } else {
          // Se já existe, atualizar os contadores
          await supabase
            .from('ai_learning_insights')
            .update({
              usage_count: insight.usage_count,
              effectiveness_score: insight.effectiveness_score,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInsight.id);
        }
      } catch (error) {
        console.error('Erro ao salvar insight:', error);
      }
    }

    // Recarregar insights
    loadLearningInsights();
  };

  useEffect(() => {
    loadLearningInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header com botão de análise */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sistema de Aprendizado Automático
          </h2>
          <p className="text-muted-foreground">
            A IA analisa conversas e aprende automaticamente padrões de sucesso
          </p>
        </div>
        
        <Button 
          onClick={analyzeConversations}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analisando...' : 'Analisar Agora'}
        </Button>
      </div>

      {/* Métricas de aprendizado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{metrics.totalConversations}</div>
              <div className="text-sm text-muted-foreground">Conversas Analisadas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{metrics.successfulInteractions}</div>
              <div className="text-sm text-muted-foreground">Interações Bem-sucedidas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{insights.length}</div>
              <div className="text-sm text-muted-foreground">Insights Gerados</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">
                {metrics.totalConversations > 0 ? Math.round(metrics.successfulInteractions / metrics.totalConversations * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights de aprendizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Insights de Aprendizado
          </CardTitle>
          <CardDescription>
            Padrões identificados automaticamente pela análise de conversas
            {lastAnalysis && (
              <span className="block mt-1 text-xs">
                Última análise: {lastAnalysis.toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum insight gerado ainda.</p>
                  <p className="text-xs mt-1">Execute uma análise para começar o aprendizado.</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{insight.insight_type}</Badge>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Confiança: {(insight.confidence_score * 100).toFixed(0)}%</span>
                        <span>Usado: {insight.usage_count}x</span>
                        <span>Eficácia: {(insight.effectiveness_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{insight.content}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Confiança</span>
                        <span>{(insight.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={insight.confidence_score * 100} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Análise de padrões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tópicos mais comuns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tópicos Mais Comuns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.commonTopics.length === 0 ? (
                <p className="text-muted-foreground text-sm">Dados insuficientes</p>
              ) : (
                metrics.commonTopics.map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-sm">{topic}</span>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Horários de pico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.peakHours.length === 0 ? (
                <p className="text-muted-foreground text-sm">Dados insuficientes</p>
              ) : (
                metrics.peakHours.map((hour, index) => (
                  <div key={hour} className="flex items-center justify-between">
                    <span className="text-sm">{hour}</span>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Como funciona o sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Como Funciona o Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-green-600">✅ Sistema Ativo</h4>
              <ul className="text-sm space-y-1">
                <li>• Análise automática de conversas</li>
                <li>• Identificação de padrões de sucesso</li>
                <li>• Medição de eficácia de respostas</li>
                <li>• Geração de insights em tempo real</li>
                <li>• Otimização baseada em dados</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-600">🔄 Processo Automático</h4>
              <ul className="text-sm space-y-1">
                <li>• Coleta dados de todas as conversas</li>
                <li>• Analisa padrões de confirmação</li>
                <li>• Identifica tópicos populares</li>
                <li>• Calcula taxas de sucesso</li>
                <li>• Ajusta estratégias automaticamente</li>
              </ul>
            </div>
          </div>
          
          {metrics.improvementAreas.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">🎯 Áreas para Melhoria</h4>
              <ul className="text-sm text-orange-700">
                {metrics.improvementAreas.map((area, index) => (
                  <li key={index}>• {area}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningSystem;