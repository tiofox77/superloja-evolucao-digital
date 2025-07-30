import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle Facebook webhook verification (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      // Se não tem parâmetros de verificação, retorna status OK
      if (!mode && !token && !challenge) {
        return new Response('Webhook Facebook está online! ✅', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }
      
      const VERIFY_TOKEN = 'minha_superloja_webhook_token_2024';
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      } else {
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body = await req.text();
      let data;
      
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      if (data.entry && data.entry.length > 0) {
        for (const entry of data.entry) {
          if (entry.messaging && entry.messaging.length > 0) {
            for (const messaging of entry.messaging) {
              if (messaging.message && messaging.message.text) {
                await handleMessage(messaging, supabase);
              }
            }
          }
        }
      }
      
      return new Response('OK', { 
        status: 200,
        headers: corsHeaders
      });
    }
    
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function handleMessage(messaging: any, supabase: any) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Mensagem de ${senderId}: ${messageText}`);
  
  try {
    // Verificar se o bot está habilitado
    const { data: botSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'bot_enabled')
      .single();
    
    if (botSettings?.value !== 'true') {
      console.log('🚫 Bot desabilitado');
      return;
    }
    
    // Salvar mensagem recebida
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: messageText,
      type: 'received',
      timestamp: new Date().toISOString()
    });
    
    // Processar com IA
    const aiResponse = await callOpenAIDirectly(messageText, senderId, supabase);
    
    // Enviar resposta
    await sendFacebookMessage(senderId, aiResponse, supabase);
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
  }
}

async function callOpenAIDirectly(message: string, senderId: string, supabase: any): Promise<string> {
  try {
    // Buscar produtos relevantes baseado na mensagem do usuário
    let products = [];
    const lowerMessage = message.toLowerCase();
    
    // Se pergunta sobre fones, buscar TODOS os fones
    if (lowerMessage.includes('fone') || lowerMessage.includes('auricular')) {
      const { data: headphones } = await supabase
        .from('products')
        .select('id, name, slug, price, description, image_url')
        .ilike('name', '%fone%')
        .eq('active', true)
        .eq('in_stock', true)
        .order('name');
      products = headphones || [];
    }
    // Se pergunta sobre smartphones
    else if (lowerMessage.includes('smartphone') || lowerMessage.includes('telefone') || lowerMessage.includes('telemóvel')) {
      const { data: phones } = await supabase
        .from('products')
        .select('id, name, slug, price, description, image_url')
        .or('name.ilike.%smartphone%,name.ilike.%telefone%,name.ilike.%telemóvel%')
        .eq('active', true)
        .eq('in_stock', true)
        .order('name');
      products = phones || [];
    }
    // Busca geral para outros produtos
    else {
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, name, slug, price, description, image_url')
        .eq('active', true)
        .eq('in_stock', true)
        .limit(8)
        .order('featured', { ascending: false });
      products = allProducts || [];
    }
    
    // Buscar histórico da conversa
    const { data: history } = await supabase
      .from('ai_conversations')
      .select('message, type')
      .eq('user_id', senderId)
      .eq('platform', 'facebook')
      .order('timestamp', { ascending: false })
      .limit(6);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return getFallbackResponse(message, products || []);
    }

    // Construir lista de produtos formatada para a IA
    let productsInfo = '';
    if (products && products.length > 0) {
      productsInfo = '\n\nPRODUTOS DISPONÍVEIS:\n';
      products.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        productsInfo += `${index + 1}. ${product.name} - ${price} Kz\n`;
        productsInfo += `   Link: https://superloja.vip/produto/${product.slug}\n`;
        if (product.image_url) {
          productsInfo += `   Imagem: ${product.image_url}\n`;
        }
        if (product.description) {
          productsInfo += `   Descrição: ${product.description.substring(0, 100)}...\n`;
        }
      });
      productsInfo += `\nTOTAL DE PRODUTOS ENCONTRADOS: ${products.length}`;
    }

    const systemPrompt = `Você é um vendedor angolano simpático da SuperLoja (https://superloja.vip).

PERSONALIDADE: Amigável, direto, conhece bem os produtos, fala como um angolano real.

${productsInfo}

CONVERSA ANTERIOR:
${(history || []).reverse().map(h => `${h.type === 'received' ? 'Cliente' : 'Você'}: ${h.message}`).join('\n')}

INSTRUÇÕES CRÍTICAS:
- Quando cliente perguntar sobre produtos, liste TODOS os produtos disponíveis no formato EXATO abaixo
- NUNCA omita produtos da lista - mostre TODOS os ${products?.length || 0} produtos encontrados
- Use SEMPRE este formato para produtos:

FORMATO OBRIGATÓRIO PARA PRODUTOS:
Olá! Tudo bem? 😊 Aqui estão os [CATEGORIA] disponíveis:

1. *[NOME DO PRODUTO]* - [PREÇO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
   📸 ![Imagem]([URL_DA_IMAGEM])

2. *[NOME DO PRODUTO]* - [PREÇO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
   📸 ![Imagem]([URL_DA_IMAGEM])

[Continue para TODOS os ${products?.length || 0} produtos da lista]

Qual deles você gostaria? 😊

REGRAS CRÍTICAS:
- Use * para texto em negrito (*produto*)
- Use exatamente ![Imagem](URL) para imagens
- Use [Ver produto](URL) para links
- Numere sempre os produtos (1., 2., 3...)
- Use preços EXATOS da lista acima
- MOSTRE TODOS OS PRODUTOS - nunca omita nenhum
- Use URLs EXATAS de imagem e link da lista
- Se for sobre fones, mostre TODOS os 8 fones disponíveis`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1200,
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Resposta inválida da OpenAI');
    }

  } catch (error) {
    console.error('Erro OpenAI:', error);
    return getFallbackResponse(message, []);
  }
}

function getFallbackResponse(message: string, products: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('fone') || lowerMessage.includes('auricular')) {
    // Se há produtos fones carregados, usar eles
    if (products.length > 0) {
      let response = "Olá! Tudo bem? 😊 Aqui estão os fones de ouvido disponíveis:\n\n";
      products.forEach((product, index) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        response += `${index + 1}. *${product.name}* - ${price} Kz\n`;
        response += `   🔗 [Ver produto](https://superloja.vip/produto/${product.slug})\n`;
        if (product.image_url) {
          response += `   📸 ![Imagem](${product.image_url})\n`;
        }
        response += "\n";
      });
      response += "Qual deles você gostaria? 😊";
      return response;
    }
    return `Temos fones de ouvido incríveis! Veja em https://superloja.vip 🎧`;
  }
  
  if (lowerMessage.includes('smartphone') || lowerMessage.includes('telefone')) {
    return `Smartphones com ótimos preços! Confira: https://superloja.vip 📱`;
  }
  
  if (lowerMessage.includes('preço') || lowerMessage.includes('custo')) {
    return `Nossos preços são os melhores de Angola! Ver catálogo: https://superloja.vip 💰`;
  }
  
  return `Olá! Bem-vindo à SuperLoja! 😊 Temos produtos incríveis com entrega grátis. O que procura? https://superloja.vip`;
}

async function sendFacebookMessage(recipientId: string, messageText: string, supabase: any) {
  try {
    const { data: pageTokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = pageTokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Facebook Page Access Token não encontrado');
      return;
    }

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;
    
    const payload = {
      recipient: { id: recipientId },
      message: { text: messageText },
      messaging_type: 'RESPONSE'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao enviar mensagem Facebook:', response.status, errorText);
    } else {
      console.log('✅ Mensagem enviada para Facebook');
    }

  } catch (error) {
    console.error('❌ Erro geral ao enviar mensagem:', error);
  }
}