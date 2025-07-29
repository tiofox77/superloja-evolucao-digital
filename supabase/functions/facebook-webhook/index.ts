import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message: {
    mid: string;
    text?: string;
    attachments?: any[];
  };
}

interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging: FacebookMessage[];
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Handle Facebook webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN');
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Facebook webhook verified');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Verification failed', { status: 403 });
      }
    }

    // Handle incoming messages
    if (req.method === 'POST') {
      const data = await req.json();
      
      for (const entry of data.entry as FacebookWebhookEntry[]) {
        for (const messaging of entry.messaging) {
          if (messaging.message) {
            await handleMessage(messaging, supabase);
          }
        }
      }
      
      return new Response('OK', { status: 200 });
    }
    
    return new Response('Method not allowed', { status: 405 });
    
  } catch (error) {
    console.error('Error in facebook-webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function handleMessage(messaging: FacebookMessage, supabase: any) {
  const senderId = messaging.sender.id;
  const messageText = messaging.message.text;
  
  if (!messageText) {
    console.log('Mensagem sem texto recebida, ignorando');
    return;
  }
  
  console.log(`📨 Mensagem de ${senderId}: ${messageText}`);
  
  try {
    // Verificar se o bot está habilitado
    const { data: botSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'bot_enabled')
      .single();
    
    if (botSettings?.value !== 'true') {
      console.log('🚫 Bot desabilitado nas configurações');
      return;
    }
    
    // Salvar conversa no banco
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
    console.log(`🤖 Resposta gerada: ${aiResponse}`);
    
    // Enviar resposta
    await sendFacebookMessage(senderId, aiResponse);
    console.log('📤 Resposta enviada para Facebook');
    
    // Salvar resposta no banco
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
    // Enviar mensagem de erro amigável
    await sendFacebookMessage(senderId, 'Desculpe, tive um problema técnico. Tente novamente em alguns minutos!');
  }
}

async function processWithAI(message: string, userId: string, supabase: any): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  // Buscar contexto do usuário (produtos, pedidos anteriores)
  const { data: userContext } = await supabase
    .from('users')
    .select('*')
    .eq('facebook_id', userId)
    .single();
  
  // Buscar produtos relevantes
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${message}%,description.ilike.%${message}%`)
    .limit(5);
    
  // Preparar contexto para IA
  const context = {
    user: userContext,
    products: products,
    conversation_history: await getConversationHistory(userId, supabase)
  };
  
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
2. Explicar como comprar no site e Facebook
3. Promover vantagens de ter conta no site
4. Responder dúvidas sobre produtos

VANTAGENS DE TER CONTA NO SITE:
- Histórico de pedidos
- Favoritos salvos
- Descontos exclusivos
- Checkout mais rápido
- Notificações de ofertas
- Suporte prioritário

COMO COMPRAR:
- Site: Adicionar ao carrinho → Checkout → Pagamento
- Facebook: Comentar "QUERO" → Conversar via DM → Finalizar

PRODUTOS DISPONÍVEIS:
${products?.map(p => `${p.name} - ${p.price}AOA - ${p.description}`).join('\n')}

Responda em português de Angola, seja amigável e útil. Máximo 160 caracteres.
  `;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Erro na API OpenAI:', error);
    return `Olá! Sou o assistente da SuperLoja 🛒 
    
Como posso ajudá-lo hoje? Temos produtos incríveis disponíveis! 

Para ver nosso catálogo completo: https://superloja.vip`;
  }
}

async function sendFacebookMessage(recipientId: string, message: string) {
  const PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  
  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_PAGE_ACCESS_TOKEN não configurado');
    throw new Error('Facebook Page Access Token não configurado');
  }
  
  console.log(`📤 Enviando mensagem para ${recipientId}: ${message.substring(0, 50)}...`);
  
  const messageData = {
    recipient: { id: recipientId },
    message: { text: message }
  };
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Mensagem enviada com sucesso:', result.message_id);
    } else {
      console.error('❌ Erro na API Facebook:', result);
      throw new Error(`Facebook API error: ${result.error?.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
}

async function getConversationHistory(userId: string, supabase: any) {
  const { data } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(10);
    
  return data || [];
}
