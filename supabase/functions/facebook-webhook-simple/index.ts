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

  const url = new URL(req.url);
  console.log('🚀 === WEBHOOK SIMPLES CHAMADO ===');
  console.log('Método:', req.method);
  console.log('URL completa:', req.url);

  // Verificação GET (Facebook webhook)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('📋 Parâmetros GET:', { mode, token, challenge });

    if (mode === 'subscribe' && token === 'superloja_verify_123') {
      console.log('✅ Webhook verificado com sucesso');
      return new Response(challenge, { headers: corsHeaders });
    } else {
      console.log('❌ Token inválido:', token);
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }
  }

  // POST - Mensagens do Facebook
  if (req.method === 'POST') {
    try {
      const body = await req.text();
      console.log('📦 Body recebido:', body);

      const data = JSON.parse(body);

      if (data.object === 'page' && data.entry) {
        for (const entry of data.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              if (messaging.message && messaging.message.text) {
                await handleSimpleMessage(messaging, req);
              }
            }
          }
        }
      }

      return new Response('OK', { 
        status: 200,
        headers: corsHeaders
      });
    } catch (error) {
      console.error('❌ Erro:', error);
      return new Response('Error', { status: 500, headers: corsHeaders });
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders
  });
});

async function handleSimpleMessage(messaging: any, req: Request) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  console.log(`📨 Mensagem de ${senderId}: ${messageText}`);
  
  try {
    // Configurar Supabase
    const supabaseUrl = 'https://fijbvihinhuedkvkxwir.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpamJ2aWhpbmh1ZWRrdmt4d2lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcwNjQ3OSwiZXhwIjoyMDY3MjgyNDc5fQ.VYJsLBOFlM0LSZPCJeKTgJgLa_-0lEFHf77M3ib8GQI';

    // Buscar configurações AI
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/ai_settings?select=key,value&key=in.(openai_api_key,bot_enabled)`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const settings = await settingsResponse.json();
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    if (settingsMap.bot_enabled !== 'true') {
      console.log('🚫 Bot desabilitado');
      return;
    }

    const openaiApiKey = settingsMap.openai_api_key;
    if (!openaiApiKey) {
      console.log('❌ OpenAI key não configurada');
      return;
    }

    // Buscar produtos
    const productsResponse = await fetch(`${supabaseUrl}/rest/v1/products?select=name,price,slug&active=eq.true&in_stock=eq.true&order=name`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    const products = await productsResponse.json();

    // Preparar prompt simples
    const systemPrompt = `Você é o assistente da SUPERLOJA em Angola. Seja humano e natural.

INFORMAÇÕES:
- Localização: Luanda, Angola
- Moeda: Kz (Kwanza)
- Entrega grátis
- WhatsApp: +244 930 000 000
- Site: https://superloja.vip

PRODUTOS DISPONÍVEIS:
${products.map((p: any) => `• ${p.name} - ${parseFloat(p.price).toLocaleString('pt-AO')} Kz`).join('\n')}

INSTRUÇÕES:
- Seja caloroso e amigável
- Use 1-2 emojis
- Máximo 2-3 frases
- Para compras: pedir nome, telefone, endereço
- Use preços da lista acima

Seja humano e simpático!`;

    // Chamar OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content || 'Olá! Como posso ajudar? 😊';

    console.log('🤖 Resposta:', aiResponse);

    // Enviar resposta para Facebook
    await sendToFacebook(senderId, aiResponse, settingsMap);

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
  }
}

async function sendToFacebook(senderId: string, message: string, settings: any) {
  try {
    const facebookToken = settings.facebook_page_access_token || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!facebookToken) {
      console.error('❌ Token Facebook não configurado');
      return;
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${facebookToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: message }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro Facebook:', error);
    } else {
      console.log('✅ Mensagem enviada');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar:', error);
  }
}