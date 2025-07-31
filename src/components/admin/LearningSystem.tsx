import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LearningInsight {
  id: string;
  insight_type: string;
  content: string;
  confidence_score: number;
  usage_count: number;
  effectiveness_score: number;
  created_at: string;
  metadata?: any;
}

interface LearningStats {
  totalInsights: number;
  highConfidenceInsights: number;
  totalUsages: number;
  averageEffectiveness: number;
  recentInsights: number;
}

export const LearningSystem = () => {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    totalInsights: 0,
    highConfidenceInsights: 0,
    totalUsages: 0,
    averageEffectiveness: 0,
    recentInsights: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInsights(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
      toast.error('Erro ao carregar dados de aprendizado');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (insightsData: LearningInsight[]) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: LearningStats = {
      totalInsights: insightsData.length,
      highConfidenceInsights: insightsData.filter(i => i.confidence_score > 0.8).length,
      totalUsages: insightsData.reduce((sum, i) => sum + i.usage_count, 0),
      averageEffectiveness: insightsData.length > 0 
        ? insightsData.reduce((sum, i) => sum + i.effectiveness_score, 0) / insightsData.length 
        : 0,
      recentInsights: insightsData.filter(i => new Date(i.created_at) > oneDayAgo).length
    };

    setStats(stats);
  };

  const generateNewInsights = async () => {
    setIsGenerating(true);
    try {
      // Buscar conversas recentes para análise
      const { data: conversations, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (convError) throw convError;

      if (conversations && conversations.length > 0) {
        // Analisar padrões e gerar insights
        const newInsights = await analyzeConversationPatterns(conversations);
        
        // Salvar novos insights no banco
        for (const insight of newInsights) {
          const { error: insertError } = await supabase
            .from('ai_learning_insights')
            .insert(insight);

          if (insertError) {
            console.error('Erro ao salvar insight:', insertError);
          }
        }

        // Recarregar dados
        await loadLearningData();
        toast.success(`${newInsights.length} novos insights gerados!`);
      } else {
        toast.info('Não há conversas suficientes para gerar novos insights');
      }
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      toast.error('Erro ao gerar novos insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeConversationPatterns = async (conversations: any[]): Promise<any[]> => {
    const insights = [];

    // Análise 1: Palavras mais frequentes nas perguntas dos usuários
    const userMessages = conversations.filter(c => c.type === 'received');
    const wordFrequency = analyzeWordFrequency(userMessages);
    
    if (wordFrequency.length > 0) {
      insights.push({
        insight_type: 'frequent_topics',
        content: `Tópicos mais mencionados pelos usuários: ${wordFrequency.slice(0, 5).map(w => w.word).join(', ')}`,
        confidence_score: 0.8,
        usage_count: 1,
        effectiveness_score: 0.7,
        metadata: { 
          word_frequency: wordFrequency.slice(0, 10),
          analysis_date: new Date().toISOString()
        }
      });
    }

    // Análise 2: Horários de maior atividade
    const hourActivity = analyzeActivityByHour(conversations);
    const peakHour = hourActivity.reduce((max, current) => 
      current.count > max.count ? current : max
    );

    insights.push({
      insight_type: 'peak_activity',
      content: `Horário de maior atividade: ${peakHour.hour}h com ${peakHour.count} mensagens`,
      confidence_score: 0.9,
      usage_count: 1,
      effectiveness_score: 0.8,
      metadata: {
        peak_hour: peakHour.hour,
        activity_distribution: hourActivity,
        analysis_date: new Date().toISOString()
      }
    });

    // Análise 3: Padrões de resposta bem-sucedida
    const botMessages = conversations.filter(c => c.type === 'sent');
    const responsePatterns = analyzeResponsePatterns(botMessages);

    if (responsePatterns.length > 0) {
      insights.push({
        insight_type: 'successful_responses',
        content: `Padrões de resposta mais eficazes identificados`,
        confidence_score: 0.7,
        usage_count: 1,
        effectiveness_score: 0.8,
        metadata: {
          patterns: responsePatterns,
          analysis_date: new Date().toISOString()
        }
      });
    }

    // Análise 4: Detecção de novos produtos mencionados
    const productMentions = analyzeProductMentions(userMessages);
    if (productMentions.length > 0) {
      insights.push({
        insight_type: 'product_interest',
        content: `Produtos mais procurados: ${productMentions.slice(0, 3).join(', ')}`,
        confidence_score: 0.8,
        usage_count: 1,
        effectiveness_score: 0.9,
        metadata: {
          products: productMentions,
          analysis_date: new Date().toISOString()
        }
      });
    }

    return insights;
  };

  const analyzeWordFrequency = (messages: any[]) => {
    const wordCount: { [key: string]: number } = {};
    const commonWords = ['o', 'a', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'é', 'eu', 'que', 'esse', 'essa'];

    messages.forEach(msg => {
      const words = msg.message.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word));

      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  };

  const analyzeActivityByHour = (conversations: any[]) => {
    const hourCount: { [hour: number]: number } = {};
    
    for (let i = 0; i < 24; i++) {
      hourCount[i] = 0;
    }

    conversations.forEach(conv => {
      const hour = new Date(conv.timestamp).getHours();
      hourCount[hour]++;
    });

    return Object.entries(hourCount)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  };

  const analyzeResponsePatterns = (botMessages: any[]) => {
    // Identificar padrões comuns nas respostas do bot
    const patterns = [];
    const greetingPattern = botMessages.filter(msg => 
      msg.message.toLowerCase().includes('olá') || 
      msg.message.toLowerCase().includes('oi') ||
      msg.message.toLowerCase().includes('bom dia')
    );

    if (greetingPattern.length > 0) {
      patterns.push({
        type: 'greeting',
        count: greetingPattern.length,
        effectiveness: 0.8
      });
    }

    return patterns;
  };

  const analyzeProductMentions = (userMessages: any[]) => {
    const productKeywords = ['smartphone', 'telefone', 'tv', 'televisão', 'computador', 'laptop', 'tablet', 'fone', 'speaker', 'camera'];
    const mentions: { [product: string]: number } = {};

    userMessages.forEach(msg => {
      const lowerMessage = msg.message.toLowerCase();
      productKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          mentions[keyword] = (mentions[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(mentions)
      .sort(([,a], [,b]) => b - a)
      .map(([product]) => product);
  };

  const getInsightTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'frequent_topics': 'bg-blue-100 text-blue-800',
      'peak_activity': 'bg-green-100 text-green-800',
      'successful_responses': 'bg-purple-100 text-purple-800',
      'product_interest': 'bg-orange-100 text-orange-800',
      'user_pattern': 'bg-yellow-100 text-yellow-800',
      'confirmation_pattern': 'bg-emerald-100 text-emerald-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'frequent_topics':
        return <TrendingUp className="h-4 w-4" />;
      case 'peak_activity':
        return <CheckCircle className="h-4 w-4" />;
      case 'successful_responses':
        return <Brain className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalInsights}</div>
              <div className="text-sm text-muted-foreground">Total de Insights</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.highConfidenceInsights}</div>
              <div className="text-sm text-muted-foreground">Alta Confiança</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalUsages}</div>
              <div className="text-sm text-muted-foreground">Usos Totais</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(stats.averageEffectiveness * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Eficácia Média</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sistema de Aprendizado</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadLearningData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={generateNewInsights}
            disabled={isGenerating}
          >
            <Brain className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
            {isGenerating ? 'Gerando...' : 'Gerar Insights'}
          </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Status do Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Taxa de Aprendizado</h4>
              <Progress value={Math.min(stats.recentInsights * 10, 100)} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {stats.recentInsights} novos insights nas últimas 24h
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Qualidade dos Insights</h4>
              <Progress value={Math.round(stats.averageEffectiveness * 100)} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Eficácia média de {Math.round(stats.averageEffectiveness * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum insight encontrado. Clique em "Gerar Insights" para começar.</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.insight_type)}
                      <Badge className={getInsightTypeColor(insight.insight_type)}>
                        {insight.insight_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Confiança: {Math.round(insight.confidence_score * 100)}%</span>
                      <span>Usado: {insight.usage_count}x</span>
                      <span>Eficácia: {Math.round(insight.effectiveness_score * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{insight.content}</p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(insight.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};