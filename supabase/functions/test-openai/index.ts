import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { api_key, model = 'gpt-4o-mini', mode = 'test' } = await req.json();

    const apiKey = api_key || Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('API key é obrigatória');
    }

    if (mode === 'list') {
      const list = await listOpenAIModels(apiKey);
      return new Response(JSON.stringify({ success: true, ...list }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🧪 Testando modelo OpenAI: ${model}`);

    // Testar conexão com OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente de teste. Responda apenas "TESTE OK".' 
          },
          { 
            role: 'user', 
            content: 'Teste de conexão' 
          }
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro OpenAI:', data);
      throw new Error(data.error?.message || 'Erro na API OpenAI');
    }

    const testResponse = data.choices[0].message.content;
    console.log(`✅ Resposta do modelo: ${testResponse}`);

    // Buscar informações sobre o modelo
    const modelInfo = await getModelInfo(model);

    return new Response(JSON.stringify({
      success: true,
      model: model,
      response: testResponse,
      usage: data.usage,
      model_info: modelInfo,
      test_timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro no teste OpenAI:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getModelInfo(model: string) {
  const models: { [key: string]: any } = {
    'gpt-4.1-2025-04-14': {
      name: 'GPT-4.1',
      description: 'Flagship model - Mais poderoso',
      context_window: '128K tokens',
      pricing: 'Alto',
      recommended_for: 'Tarefas complexas que exigem máxima qualidade'
    },
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      description: 'Rápido e econômico',
      context_window: '128K tokens', 
      pricing: 'Baixo',
      recommended_for: 'Chatbots, respostas rápidas, tarefas simples'
    },
    'o3-2025-04-16': {
      name: 'O3',
      description: 'Raciocínio avançado',
      context_window: '128K tokens',
      pricing: 'Muito Alto',
      recommended_for: 'Problemas complexos que exigem raciocínio profundo'
    },
    'o4-mini-2025-04-16': {
      name: 'O4 Mini',
      description: 'Raciocínio rápido',
      context_window: '128K tokens',
      pricing: 'Médio',
      recommended_for: 'Coding, análise visual, raciocínio eficiente'
    }
  };

  return models[model] || {
    name: model,
    description: 'Modelo personalizado',
    context_window: 'Desconhecido',
    pricing: 'Variável',
    recommended_for: 'Verificar documentação OpenAI'
  };
}

async function listOpenAIModels(apiKey: string) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Erro ao listar modelos:', data);
    throw new Error(data.error?.message || 'Erro ao listar modelos');
  }
  const entries = (data.data || [])
    .map((m: any) => ({ id: m.id, owned_by: m.owned_by }))
    .sort((a: any, b: any) => a.id.localeCompare(b.id));
  const featuredSet = new Set([
    'gpt-4.1-2025-04-14',
    'gpt-4o',
    'gpt-4o-mini',
    'o3-2025-04-16',
    'o4-mini-2025-04-16',
    'gpt-image-1'
  ]);
  const featured = entries.filter((m: any) => featuredSet.has(m.id)).map((m: any) => m.id);
  return { mode: 'list', total: entries.length, models: entries, featured };
}
