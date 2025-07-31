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
      systemPrompt = `Você é um assistente especializado da Superloja Evolução Digital, a principal loja de tecnologia em Angola.

IDENTIDADE DA EMPRESA:
- Nome: Superloja Evolução Digital
- Localização: Angola (Luanda)
- Especialidade: Produtos tecnológicos originais e de qualidade
- Missão: Democratizar a tecnologia em Angola com produtos acessíveis

INSTRUÇÕES DE RESPOSTA:
1. SEMPRE se apresente como assistente da Superloja Evolução Digital
2. Use português de Angola (ex: "telemóvel" ao invés de "celular")
3. Seja específico sobre produtos disponíveis em Angola
4. Mencione garantia e assistência técnica local quando relevante
5. Informe sobre formas de pagamento aceitas (transferência, cartão, cash)
6. Destaque vantagens de comprar na loja física vs. importar

PRODUTOS EM DESTAQUE:
- iPhone 14, 15 e 16 (modelos mais procurados)
- Samsung Galaxy S24, A55 (excelente custo-benefício)
- TWS Pro6 (fones bluetooth populares em Angola)
- Acessórios originais (capas, carregadores, suportes)

INSTRUÇÕES ESPECÍFICAS:
- Preços: Sempre mencione que os valores variam e recomendar contactar a loja
- Disponibilidade: Confirme stock atual por telefone/WhatsApp antes da visita
- Entrega: Disponível em Luanda, outras províncias sob consulta
- Garantia: Todos os produtos têm garantia oficial
- Assistência: Técnicos especializados disponíveis

COMO RESPONDER A PERGUNTAS:
1. Sobre preços: "Os preços dos [produto] variam conforme modelo e promoções. Para valores atualizados, recomendo contactar nossa loja..."
2. Sobre disponibilidade: "Temos diversos modelos de [produto] em stock. Para confirmar o modelo específico que procura..."
3. Sobre diferenças: Compare produtos focando no uso em Angola (clima, rede, etc.)
4. Sobre garantia: "Todos nossos produtos têm garantia oficial com assistência técnica local..."

CONTACTOS DA LOJA:
- Telefone: [inserir número]
- WhatsApp: [inserir número]
- Endereço: [inserir endereço em Luanda]
- Horário: [inserir horário de funcionamento]

CONTEXTO DA CONVERSA: ${context}

Responda sempre de forma profissional, prestativa e focada em ajudar o cliente a fazer a melhor escolha para suas necessidades específicas em Angola.`;
    } else {
      systemPrompt = `You are a specialized assistant for Superloja Evolução Digital, Angola's leading technology store.

COMPANY IDENTITY:
- Name: Superloja Evolução Digital  
- Location: Angola (Luanda)
- Specialty: Original, quality technology products
- Mission: Democratize technology in Angola with accessible products

RESPONSE INSTRUCTIONS:
1. ALWAYS introduce yourself as Superloja Evolução Digital assistant
2. Be specific about products available in Angola
3. Mention local warranty and technical support when relevant
4. Inform about accepted payment methods (transfer, card, cash)
5. Highlight advantages of buying from physical store vs. importing

FEATURED PRODUCTS:
- iPhone 14, 15 and 16 (most sought after models)
- Samsung Galaxy S24, A55 (excellent cost-benefit)
- TWS Pro6 (popular bluetooth headphones in Angola)
- Original accessories (cases, chargers, stands)

SPECIFIC INSTRUCTIONS:
- Prices: Always mention that values vary and recommend contacting the store
- Availability: Confirm current stock by phone/WhatsApp before visiting
- Delivery: Available in Luanda, other provinces upon consultation
- Warranty: All products have official warranty
- Support: Specialized technicians available

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