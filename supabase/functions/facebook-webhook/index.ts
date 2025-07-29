import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // LOGS DETALHADOS PARA DEBUG FACEBOOK
  console.log('🚀 === WEBHOOK CHAMADO ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Método:', req.method);
  console.log('URL completa:', req.url);
  
  // CAPTURAR TODOS OS HEADERS (especialmente do Facebook)
  console.log('📋 === TODOS OS HEADERS ===');
  const headers = Object.fromEntries(req.headers.entries());
  console.log('Headers completos:', JSON.stringify(headers, null, 2));
  
  // HEADERS ESPECÍFICOS DO FACEBOOK
  console.log('🔍 === HEADERS FACEBOOK ESPECÍFICOS ===');
  console.log('X-Hub-Signature-256:', req.headers.get('X-Hub-Signature-256'));
  console.log('X-Hub-Signature:', req.headers.get('X-Hub-Signature'));
  console.log('X-Forwarded-For:', req.headers.get('X-Forwarded-For'));
  console.log('User-Agent:', req.headers.get('User-Agent'));
  console.log('Content-Type:', req.headers.get('Content-Type'));
  console.log('Content-Length:', req.headers.get('Content-Length'));
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Processando request OPTIONS (CORS preflight)');
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
        console.log('📡 Webhook acessado diretamente - Status OK');
        return new Response('Webhook Facebook está online e funcionando! ✅', { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
      
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
      console.log('📨 === PROCESSANDO POST REQUEST ===');
      
      // CAPTURAR CORPO DA REQUISIÇÃO
      const body = await req.text();
      console.log('📦 Body tamanho:', body.length, 'bytes');
      console.log('📦 Body conteúdo RAW:', body);
      
      // VERIFICAR SE É JSON VÁLIDO
      let data;
      try {
        data = JSON.parse(body);
        console.log('✅ JSON válido');
        console.log('📊 Dados parseados (estrutura completa):');
        console.log(JSON.stringify(data, null, 2));
        
        // ANÁLISE DETALHADA DA ESTRUTURA
        console.log('🔍 === ANÁLISE DA ESTRUTURA ===');
        console.log('Tipo do objeto:', typeof data);
        console.log('Propriedades do objeto:', Object.keys(data));
        
        if (data.object) {
          console.log('Object type:', data.object);
        }
        
        if (data.entry) {
          console.log('Entry array length:', data.entry.length);
          data.entry.forEach((entry, index) => {
            console.log(`Entry ${index}:`, Object.keys(entry));
            if (entry.messaging) {
              console.log(`Entry ${index} messaging length:`, entry.messaging.length);
              entry.messaging.forEach((msg, msgIndex) => {
                console.log(`Messaging ${msgIndex}:`, Object.keys(msg));
                if (msg.message) {
                  console.log(`Message fields:`, Object.keys(msg.message));
                }
                if (msg.postback) {
                  console.log(`Postback fields:`, Object.keys(msg.postback));
                }
              });
            }
          });
        }
        
      } catch (parseError) {
        console.error('❌ ERRO JSON PARSE:', parseError);
        console.log('💡 Tentando processar como text/plain...');
        
        // Se não é JSON, pode ser outro formato
        return new Response('OK', { 
          status: 200,
          headers: corsHeaders
        });
      }
      
      // PROCESSAR MENSAGENS
      console.log('🚀 === INICIANDO PROCESSAMENTO ===');
      
      if (data.entry && data.entry.length > 0) {
        for (const entry of data.entry) {
          console.log('📋 Processando entry:', entry.id);
          
          if (entry.messaging && entry.messaging.length > 0) {
            for (const messaging of entry.messaging) {
              console.log('💬 Processando messaging:', Object.keys(messaging));
              
              // MENSAGEM DE TEXTO
              if (messaging.message && messaging.message.text) {
                console.log('📝 Mensagem de texto encontrada');
                await handleMessage(messaging, supabase);
              }
              
              // POSTBACK (botões)
              else if (messaging.postback) {
                console.log('🔘 Postback encontrado:', messaging.postback);
              }
              
              // OUTROS TIPOS
              else {
                console.log('❓ Tipo de messaging não reconhecido:', messaging);
              }
            }
          } else {
            console.log('⚠️ Entry sem messaging ou messaging vazio');
          }
        }
      } else {
        console.log('⚠️ Dados sem entry ou entry vazio');
      }
      
      console.log('✅ === PROCESSAMENTO COMPLETO ===');
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
    await sendFacebookMessage(senderId, aiResponse, supabase);
    
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
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente!', supabase);
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

async function sendFacebookMessage(recipientId: string, message: string, supabase: any) {
  // Primeiro tenta buscar token das configurações AI (onde o admin salva)
  let PAGE_ACCESS_TOKEN = null;
  let tokenSource = 'none';
  
  try {
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .maybeSingle();
    
    if (aiSettings?.value) {
      PAGE_ACCESS_TOKEN = aiSettings.value;
      tokenSource = 'ai_settings';
      console.log('✅ Usando token das configurações AI (admin)');
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar token AI settings, tentando Meta settings');
  }

  // Fallback 1: Configurações Meta
  if (!PAGE_ACCESS_TOKEN) {
    try {
      const { data: metaSettings } = await supabase
        .from('meta_settings')
        .select('access_token')
        .limit(1)
        .maybeSingle();
      
      if (metaSettings?.access_token) {
        PAGE_ACCESS_TOKEN = metaSettings.access_token;
        tokenSource = 'meta_settings';
        console.log('✅ Usando token das configurações Meta');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar token Meta, tentando secrets');
    }
  }
  
  // Fallback 2: Secrets do Supabase
  if (!PAGE_ACCESS_TOKEN) {
    PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    tokenSource = 'secrets';
    console.log('⚠️ Usando token das secrets como fallback');
  }
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ Nenhum token Facebook encontrado');
    return;
  }
  
  console.log(`📤 Enviando mensagem para ${recipientId}`);
  console.log(`🔑 Token source: ${tokenSource}`);
  console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
  
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
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📨 Message ID:', result.message_id);
      console.log('📱 Recipient ID:', result.recipient_id);
    } else {
      console.error('❌ Erro Facebook API (detalhado):');
      console.error('📊 Status:', response.status);
      console.error('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      console.error('💥 Error details:', result);
      
      // Log específico para diferentes tipos de erro
      if (result.error?.code === 190) {
        console.error('🔑 ERRO DE TOKEN: Token inválido ou expirado');
      } else if (result.error?.code === 200) {
        console.error('🚫 ERRO DE PERMISSÃO: Sem permissão para enviar mensagens');
      } else if (result.error?.code === 100) {
        console.error('📝 ERRO DE PARÂMETRO: Parâmetros inválidos na requisição');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro de rede/conexão ao enviar mensagem:');
    console.error('🌐 Network error:', error.message);
    console.error('🔗 URL tentativa:', `https://graph.facebook.com/v18.0/me/messages`);
    console.error('🔑 Token usado (primeiros 20 chars):', PAGE_ACCESS_TOKEN.substring(0, 20) + '...');
  }
}