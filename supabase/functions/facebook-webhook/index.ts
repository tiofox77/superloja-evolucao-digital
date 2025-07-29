import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle preflight requests
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
      
      console.log('=== WEBHOOK VERIFICATION ===');
      console.log('Mode:', mode);
      console.log('Token recebido:', token);
      console.log('Challenge:', challenge);
      
      // Token de verificação fixo
      const VERIFY_TOKEN = 'minha_superloja_webhook_token_2024';
      console.log('Token esperado:', VERIFY_TOKEN);
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ VERIFICAÇÃO APROVADA - Retornando challenge');
        return new Response(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      } else {
        console.log('❌ VERIFICAÇÃO REJEITADA');
        console.log('Mode válido?', mode === 'subscribe');
        console.log('Token válido?', token === VERIFY_TOKEN);
        return new Response('Forbidden', { 
          status: 403,
          headers: corsHeaders
        });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      console.log('📨 Recebendo mensagem via POST');
      const body = await req.text();
      console.log('Body recebido:', body);
      
      try {
        const data = JSON.parse(body);
        console.log('Dados parseados:', JSON.stringify(data, null, 2));
        
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
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
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
  
  console.log(`📨 Nova mensagem de ${senderId}: ${messageText}`);
  
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
    
    console.log('💾 Mensagem salva no banco');
    
    // Processar com IA
    const aiResponse = await processWithAI(messageText, senderId, supabase);
    console.log(`🤖 Resposta IA: ${aiResponse}`);
    
    // Enviar resposta
    await sendFacebookMessage(senderId, aiResponse);
    
    // Salvar resposta enviada
    await supabase.from('ai_conversations').insert({
      platform: 'facebook',
      user_id: senderId,
      message: aiResponse,
      type: 'sent',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Processamento completo');
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!');
  }
}

async function processWithAI(message: string, userId: string, supabase: any): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    return `Olá! Sou o assistente da SuperLoja 🛒 

Como posso ajudá-lo hoje? Temos produtos incríveis disponíveis! 

Para ver nosso catálogo: https://superloja.vip`;
  }
  
  // Buscar modelo preferido
  const { data: modelSetting } = await supabase
    .from('ai_settings')
    .select('value')
    .eq('key', 'preferred_model')
    .single();
  
  const preferredModel = modelSetting?.value || 'gpt-4o-mini';
  
  // Buscar produtos relevantes
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${message}%,description.ilike.%${message}%`)
    .limit(5);
  
  const systemPrompt = `
Você é o assistente IA da SuperLoja, uma loja online em Angola.

INFORMAÇÕES DA EMPRESA:
- Nome: SuperLoja  
- Website: https://superloja.vip
- Foco: Eletrônicos, gadgets, acessórios
- Localização: Angola
- Entrega: Todo o país

SUA MISSÃO:
1. Ajudar clientes a encontrar produtos
2. Explicar como comprar no site
3. Responder dúvidas sobre produtos
4. Ser amigável e útil

PRODUTOS DISPONÍVEIS:
${products?.map(p => `${p.name} - ${p.price}AOA - ${p.description}`).join('\n') || 'Catálogo em atualização'}

Responda em português de Angola, seja amigável. Máximo 160 caracteres.
`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.choices && data.choices[0]) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Erro na resposta da IA');
    }
    
  } catch (error) {
    console.error('Erro na API OpenAI:', error);
    return `Olá! Sou o assistente da SuperLoja 🛒 

Como posso ajudá-lo hoje? Temos produtos incríveis disponíveis! 

Para ver nosso catálogo: https://superloja.vip`;
  }
}

async function sendFacebookMessage(recipientId: string, message: string) {
  const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_PAGE_ACCESS_TOKEN não configurado');
    return;
  }
  
  console.log(`📤 Enviando mensagem para ${recipientId}`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        }),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Mensagem enviada:', result.message_id);
    } else {
      console.error('❌ Erro Facebook API:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
  }
}