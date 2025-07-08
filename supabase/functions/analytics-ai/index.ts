import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar dados de analytics dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [visitorsResult, eventsResult, ordersResult] = await Promise.all([
      supabase
        .from('visitor_analytics')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', thirtyDaysAgo.toISOString()),
      
      supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    const visitors = visitorsResult.data || [];
    const events = eventsResult.data || [];
    const orders = ordersResult.data || [];

    // Processar dados para análise
    const analyticsData = {
      totalVisitors: new Set(visitors.map(v => v.visitor_id)).size,
      totalPageViews: events.filter(e => e.event_type === 'page_view').length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      
      // Análise geográfica
      topCountries: getTopCountries(visitors),
      
      // Análise de dispositivos
      deviceBreakdown: getDeviceBreakdown(visitors),
      
      // Análise de comportamento
      bounceRate: calculateBounceRate(visitors, events),
      avgSessionDuration: calculateAvgSessionDuration(events),
      
      // Páginas mais populares
      topPages: getTopPages(events),
      
      // Horários de pico
      peakHours: getPeakHours(visitors),
      
      // Tendências
      dailyTrends: getDailyTrends(visitors)
    };

    // Se OpenAI estiver configurado, gerar insights com IA
    let aiInsights = null;
    if (openAIApiKey) {
      aiInsights = await generateAIInsights(analyticsData);
    }

    // Gerar recomendações baseadas nos dados
    const recommendations = generateRecommendations(analyticsData);

    return new Response(JSON.stringify({
      success: true,
      data: analyticsData,
      aiInsights,
      recommendations,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na análise de analytics:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getTopCountries(visitors: any[]) {
  const countriesMap = {};
  visitors.forEach(visitor => {
    if (visitor.country) {
      countriesMap[visitor.country] = (countriesMap[visitor.country] || 0) + 1;
    }
  });

  return Object.entries(countriesMap)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([country, count]) => ({ country, visitors: count }));
}

function getDeviceBreakdown(visitors: any[]) {
  const devicesMap = {};
  visitors.forEach(visitor => {
    if (visitor.device_type) {
      devicesMap[visitor.device_type] = (devicesMap[visitor.device_type] || 0) + 1;
    }
  });

  const total = visitors.length;
  return Object.entries(devicesMap).map(([device, count]) => ({
    device,
    count,
    percentage: Math.round(((count as number) / total) * 100)
  }));
}

function calculateBounceRate(visitors: any[], events: any[]) {
  const sessionEvents = {};
  events.forEach(event => {
    if (!sessionEvents[event.session_id]) {
      sessionEvents[event.session_id] = 0;
    }
    sessionEvents[event.session_id]++;
  });

  const bounces = Object.values(sessionEvents).filter(count => count === 1).length;
  const totalSessions = Object.keys(sessionEvents).length;
  
  return totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;
}

function calculateAvgSessionDuration(events: any[]) {
  const sessionDurations = {};
  
  events.forEach(event => {
    if (event.event_type === 'page_duration' && event.event_data?.duration_seconds) {
      if (!sessionDurations[event.session_id]) {
        sessionDurations[event.session_id] = 0;
      }
      sessionDurations[event.session_id] += event.event_data.duration_seconds;
    }
  });

  const durations = Object.values(sessionDurations);
  const avgSeconds = durations.length > 0 
    ? durations.reduce((sum: number, dur: number) => sum + dur, 0) / durations.length
    : 0;

  const minutes = Math.floor(avgSeconds / 60);
  const seconds = Math.floor(avgSeconds % 60);
  
  return `${minutes}m ${seconds}s`;
}

function getTopPages(events: any[]) {
  const pagesMap = {};
  events.filter(e => e.event_type === 'page_view').forEach(event => {
    const url = new URL(event.page_url).pathname;
    pagesMap[url] = (pagesMap[url] || 0) + 1;
  });

  return Object.entries(pagesMap)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));
}

function getPeakHours(visitors: any[]) {
  const hoursMap = {};
  visitors.forEach(visitor => {
    const hour = new Date(visitor.created_at).getHours();
    hoursMap[hour] = (hoursMap[hour] || 0) + 1;
  });

  return Object.entries(hoursMap)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([hour, count]) => ({ hour: `${hour}:00`, visitors: count }));
}

function getDailyTrends(visitors: any[]) {
  const dailyMap = {};
  visitors.forEach(visitor => {
    const date = new Date(visitor.created_at).toLocaleDateString();
    dailyMap[date] = (dailyMap[date] || 0) + 1;
  });

  return Object.entries(dailyMap)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => ({ date, visitors: count }));
}

async function generateAIInsights(data: any) {
  if (!openAIApiKey) return null;

  const prompt = `
Analise os seguintes dados de analytics de uma loja online e forneça insights valiosos:

Dados:
- Total de visitantes: ${data.totalVisitors}
- Total de visualizações: ${data.totalPageViews}
- Total de pedidos: ${data.totalOrders}
- Receita total: ${data.totalRevenue}
- Taxa de rejeição: ${data.bounceRate}%
- Duração média da sessão: ${data.avgSessionDuration}
- Principais países: ${JSON.stringify(data.topCountries)}
- Dispositivos: ${JSON.stringify(data.deviceBreakdown)}
- Páginas populares: ${JSON.stringify(data.topPages)}

Forneça 3-5 insights específicos e acionáveis para melhorar o desempenho da loja.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em analytics e e-commerce. Forneça insights práticos e específicos baseados nos dados apresentados.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar insights com IA:', error);
    return null;
  }
}

function generateRecommendations(data: any) {
  const recommendations = [];

  // Recomendações baseadas na taxa de rejeição
  if (data.bounceRate > 70) {
    recommendations.push({
      type: 'high_bounce_rate',
      priority: 'high',
      title: 'Taxa de Rejeição Alta',
      description: `Sua taxa de rejeição de ${data.bounceRate}% está alta. Consider otimizar o tempo de carregamento das páginas e melhorar o conteúdo inicial.`,
      actions: ['Otimizar velocidade do site', 'Melhorar headlines das páginas', 'Revisar design da página inicial']
    });
  }

  // Recomendações baseadas em dispositivos
  const mobilePercentage = data.deviceBreakdown.find(d => d.device === 'mobile')?.percentage || 0;
  if (mobilePercentage > 60) {
    recommendations.push({
      type: 'mobile_optimization',
      priority: 'high',
      title: 'Otimização Mobile Prioritária',
      description: `${mobilePercentage}% dos seus visitantes usam mobile. Priorize a experiência mobile.`,
      actions: ['Testar responsividade', 'Otimizar botões para touch', 'Simplificar checkout mobile']
    });
  }

  // Recomendações baseadas na conversão
  const conversionRate = data.totalOrders > 0 ? (data.totalOrders / data.totalVisitors) * 100 : 0;
  if (conversionRate < 2) {
    recommendations.push({
      type: 'low_conversion',
      priority: 'high',
      title: 'Taxa de Conversão Baixa',
      description: `Taxa de conversão de ${conversionRate.toFixed(2)}% pode ser melhorada.`,
      actions: ['Revisar processo de checkout', 'Adicionar reviews de produtos', 'Implementar chat de suporte']
    });
  }

  // Recomendações baseadas em geografia
  if (data.topCountries.length > 0) {
    const topCountry = data.topCountries[0];
    recommendations.push({
      type: 'geographic_focus',
      priority: 'medium',
      title: 'Foco Geográfico',
      description: `${topCountry.country} representa a maioria dos visitantes. Consider campanhas direcionadas.`,
      actions: ['Campanhas de marketing locais', 'Conteúdo no idioma local', 'Parcerias regionais']
    });
  }

  return recommendations;
}