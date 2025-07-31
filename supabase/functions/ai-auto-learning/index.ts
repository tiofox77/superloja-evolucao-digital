import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧠 Iniciando processamento de aprendizado automático...');

    // 1. Coleta dados de todas as conversas (últimas 24h)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: conversations, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .gte('timestamp', last24Hours)
      .order('timestamp', { ascending: false });

    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError);
      throw convError;
    }

    console.log(`📊 Processando ${conversations?.length || 0} conversas das últimas 24h`);

    // 2. Analisa padrões de confirmação
    const confirmationPatterns = analyzeConfirmationPatterns(conversations || []);
    
    // 3. Identifica tópicos populares
    const popularTopics = identifyPopularTopics(conversations || []);
    
    // 4. Calcula taxas de sucesso
    const successRates = calculateSuccessRates(conversations || []);
    
    // 5. Analisa contextos de usuários
    const { data: contexts } = await supabase
      .from('ai_conversation_context')
      .select('*')
      .gte('last_interaction', last24Hours);

    const userInsights = analyzeUserContexts(contexts || []);

    // Gerar insights de aprendizado
    const insights = [];

    // Insight sobre confirmações
    if (confirmationPatterns.totalConfirmations > 0) {
      insights.push({
        insight_type: 'confirmation_analysis',
        content: `Detectados ${confirmationPatterns.totalConfirmations} padrões de confirmação. Palavras mais eficazes: ${confirmationPatterns.topWords.join(', ')}. Taxa de sucesso: ${Math.round(confirmationPatterns.successRate * 100)}%`,
        confidence_score: 0.9,
        usage_count: confirmationPatterns.totalConfirmations,
        effectiveness_score: confirmationPatterns.successRate,
        metadata: {
          confirmation_words: confirmationPatterns.topWords,
          success_rate: confirmationPatterns.successRate,
          total_confirmations: confirmationPatterns.totalConfirmations
        }
      });
    }

    // Insight sobre tópicos populares
    if (popularTopics.length > 0) {
      insights.push({
        insight_type: 'popular_topics',
        content: `Tópicos mais procurados hoje: ${popularTopics.slice(0, 3).map(t => `${t.topic} (${t.count}x)`).join(', ')}. Recomendo destacar estes produtos nas respostas.`,
        confidence_score: 0.85,
        usage_count: popularTopics.reduce((sum, t) => sum + t.count, 0),
        effectiveness_score: 0.8,
        metadata: {
          topics: popularTopics,
          analysis_date: new Date().toISOString()
        }
      });
    }

    // Insight sobre taxas de sucesso
    insights.push({
      insight_type: 'success_rates',
      content: `Taxa de conversão geral: ${Math.round(successRates.conversionRate * 100)}%. Taxa de resposta: ${Math.round(successRates.responseRate * 100)}%. ${successRates.recommendations.join(' ')}`,
      confidence_score: 0.95,
      usage_count: successRates.totalInteractions,
      effectiveness_score: successRates.conversionRate,
      metadata: {
        conversion_rate: successRates.conversionRate,
        response_rate: successRates.responseRate,
        total_interactions: successRates.totalInteractions,
        recommendations: successRates.recommendations
      }
    });

    // Insight sobre padrões de usuários
    if (userInsights.patterns.length > 0) {
      insights.push({
        insight_type: 'user_behavior',
        content: `Comportamentos identificados: ${userInsights.patterns.join(', ')}. Horário de pico: ${userInsights.peakHour}h. Duração média: ${userInsights.avgDuration}min`,
        confidence_score: 0.8,
        usage_count: userInsights.totalUsers,
        effectiveness_score: 0.75,
        metadata: {
          patterns: userInsights.patterns,
          peak_hour: userInsights.peakHour,
          avg_duration: userInsights.avgDuration,
          total_users: userInsights.totalUsers
        }
      });
    }

    // Salvar insights no banco
    for (const insight of insights) {
      try {
        // Verificar se já existe insight similar hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: existingInsight } = await supabase
          .from('ai_learning_insights')
          .select('id')
          .eq('insight_type', insight.insight_type)
          .gte('created_at', today)
          .maybeSingle();

        if (existingInsight) {
          // Atualizar insight existente
          await supabase
            .from('ai_learning_insights')
            .update({
              content: insight.content,
              confidence_score: insight.confidence_score,
              usage_count: insight.usage_count,
              effectiveness_score: insight.effectiveness_score,
              metadata: insight.metadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInsight.id);
        } else {
          // Criar novo insight
          await supabase
            .from('ai_learning_insights')
            .insert(insight);
        }
      } catch (error) {
        console.error(`❌ Erro ao salvar insight ${insight.insight_type}:`, error);
      }
    }

    // Atualizar métricas de IA
    const today = new Date().toISOString().split('T')[0];
    const { data: existingMetrics } = await supabase
      .from('ai_metrics')
      .select('id')
      .eq('date', today)
      .maybeSingle();

    const metricsData = {
      date: today,
      total_messages: conversations?.length || 0,
      successful_responses: Math.round((conversations?.length || 0) * successRates.responseRate),
      failed_responses: Math.round((conversations?.length || 0) * (1 - successRates.responseRate)),
      average_response_time: 2.5,
      user_satisfaction_score: successRates.conversionRate * 100,
      platform_breakdown: analyzePlatformBreakdown(conversations || []),
      updated_at: new Date().toISOString()
    };

    if (existingMetrics) {
      await supabase
        .from('ai_metrics')
        .update(metricsData)
        .eq('id', existingMetrics.id);
    } else {
      await supabase
        .from('ai_metrics')
        .insert(metricsData);
    }

    console.log('✅ Processamento de aprendizado concluído com sucesso');

    return new Response(JSON.stringify({
      success: true,
      insights_generated: insights.length,
      conversations_analyzed: conversations?.length || 0,
      confirmation_patterns: confirmationPatterns,
      popular_topics: popularTopics,
      success_rates: successRates,
      user_insights: userInsights,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no processamento de aprendizado:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para analisar padrões de confirmação
function analyzeConfirmationPatterns(conversations: any[]) {
  const confirmationWords = ['sim', 'confirmo', 'certo', 'perfeito', 'correto', 'pode entregar', 'tudo certo', 'está bem'];
  const wordCount: { [key: string]: number } = {};
  let totalConfirmations = 0;
  let successfulFollowups = 0;

  conversations.forEach((conv, index) => {
    const message = conv.message.toLowerCase();
    const hasConfirmation = confirmationWords.some(word => message.includes(word));
    
    if (hasConfirmation) {
      totalConfirmations++;
      
      // Contar palavras específicas
      confirmationWords.forEach(word => {
        if (message.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });

      // Verificar se houve followup bem-sucedido
      const nextMessage = conversations[index + 1];
      if (nextMessage && nextMessage.type === 'sent') {
        successfulFollowups++;
      }
    }
  });

  const topWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  return {
    totalConfirmations,
    successRate: totalConfirmations > 0 ? successfulFollowups / totalConfirmations : 0,
    topWords,
    wordFrequency: wordCount
  };
}

// Função para identificar tópicos populares
function identifyPopularTopics(conversations: any[]) {
  const topicKeywords = {
    'iphone': ['iphone', 'apple', 'ios'],
    'samsung': ['samsung', 'galaxy'],
    'airpods': ['airpods', 'fones', 'auscultadores'],
    'tws_pro6': ['tws', 'pro6', 'tws pro6'],
    'precos': ['preço', 'valor', 'custo', 'quanto custa'],
    'entrega': ['entrega', 'envio', 'quando chega'],
    'pagamento': ['pagamento', 'cartão', 'transferência'],
    'disponibilidade': ['disponível', 'stock', 'estoque', 'tem']
  };

  const topicCount: { [key: string]: number } = {};

  conversations.forEach(conv => {
    const message = conv.message.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword))) {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      }
    });
  });

  return Object.entries(topicCount)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Função para calcular taxas de sucesso
function calculateSuccessRates(conversations: any[]) {
  const userGroups: { [key: string]: any[] } = {};
  
  // Agrupar por usuário
  conversations.forEach(conv => {
    if (!userGroups[conv.user_id]) {
      userGroups[conv.user_id] = [];
    }
    userGroups[conv.user_id].push(conv);
  });

  let totalUsers = Object.keys(userGroups).length;
  let usersWithResponse = 0;
  let usersWithConversion = 0;
  let totalInteractions = conversations.length;

  Object.values(userGroups).forEach(userConversations => {
    const hasResponse = userConversations.some(conv => conv.type === 'sent');
    const hasPersonalData = userConversations.some(conv => 
      conv.message.includes('nome') || 
      conv.message.includes('telefone') || 
      conv.message.includes('endereço') ||
      /\d{9}/.test(conv.message) // 9 dígitos (telefone)
    );
    const hasConfirmation = userConversations.some(conv => 
      ['sim', 'confirmo', 'certo'].some(word => conv.message.toLowerCase().includes(word))
    );

    if (hasResponse) usersWithResponse++;
    if (hasPersonalData && hasConfirmation) usersWithConversion++;
  });

  const responseRate = totalUsers > 0 ? usersWithResponse / totalUsers : 0;
  const conversionRate = totalUsers > 0 ? usersWithConversion / totalUsers : 0;

  const recommendations = [];
  if (responseRate < 0.8) recommendations.push('Melhorar tempo de resposta.');
  if (conversionRate < 0.3) recommendations.push('Otimizar coleta de dados pessoais.');
  if (conversionRate > 0.5) recommendations.push('Excelente taxa de conversão!');

  return {
    responseRate,
    conversionRate,
    totalUsers,
    totalInteractions,
    recommendations
  };
}

// Função para analisar contextos de usuários
function analyzeUserContexts(contexts: any[]) {
  const patterns = [];
  const hourCount: { [key: number]: number } = {};
  const durations = [];

  contexts.forEach(context => {
    const hour = new Date(context.last_interaction).getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;

    // Calcular duração estimada
    const startTime = new Date(context.created_at).getTime();
    const endTime = new Date(context.last_interaction).getTime();
    const duration = (endTime - startTime) / (1000 * 60); // em minutos
    if (duration > 0 && duration < 300) { // máximo 5 horas
      durations.push(duration);
    }

    // Analisar padrões
    const contextData = context.context_data || {};
    if (contextData.conversationStage === 'confirmed_purchase') {
      patterns.push('Compra confirmada rapidamente');
    }
    if (context.message_count > 10) {
      patterns.push('Conversa longa');
    }
    if (contextData.selectedProduct) {
      patterns.push('Produto específico escolhido');
    }
  });

  const peakHour = Object.entries(hourCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '14';

  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 5;

  return {
    patterns: [...new Set(patterns)],
    peakHour: parseInt(peakHour),
    avgDuration,
    totalUsers: contexts.length
  };
}

// Função para analisar breakdown por plataforma
function analyzePlatformBreakdown(conversations: any[]) {
  const platformCount: { [key: string]: number } = {};
  
  conversations.forEach(conv => {
    platformCount[conv.platform] = (platformCount[conv.platform] || 0) + 1;
  });

  return platformCount;
}