import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context = '', language = 'pt' } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Chave API da Perplexity não configurada',
        suggestion: 'Configure PERPLEXITY_API_KEY nas configurações do Supabase'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar prompt baseado no contexto
    let systemPrompt = '';
    if (language === 'pt') {
      systemPrompt = `Você é um assistente especializado em produtos de tecnologia, especificamente para uma loja em Angola. 
      Responda em português de Angola. Seja preciso, conciso e focado em:
      - Especificações técnicas do produto
      - Preços aproximados em AOA (kwanzas angolanos) se possível
      - Disponibilidade em Angola
      - Características principais
      - Comparações relevantes se houver
      
      Contexto da conversa: ${context}`;
    } else {
      systemPrompt = `You are a technology product specialist assistant for a store in Angola. 
      Be precise, concise and focus on:
      - Technical specifications
      - Approximate prices in AOA (Angolan kwanzas) if possible  
      - Availability in Angola
      - Main features
      - Relevant comparisons if any
      
      Conversation context: ${context}`;
    }

    console.log('🔍 Iniciando pesquisa:', { query, context: context.substring(0, 100) });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: true,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API Perplexity:', errorText);
      throw new Error(`Erro da API Perplexity: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta recebida da Perplexity');

    const aiResponse = data.choices?.[0]?.message?.content || 'Não foi possível obter uma resposta.';
    const relatedQuestions = data.related_questions || [];

    // Salvar a pesquisa no banco para aprendizado
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('ai_learning_insights')
      .insert({
        insight_type: 'web_search',
        content: `Pesquisa: "${query}" | Resposta: ${aiResponse.substring(0, 200)}...`,
        confidence_score: 0.8,
        usage_count: 1,
        effectiveness_score: 0.7,
        metadata: {
          search_query: query,
          context,
          related_questions: relatedQuestions,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(JSON.stringify({
      success: true,
      result: aiResponse,
      related_questions: relatedQuestions,
      search_query: query,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função ai-search-web:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});