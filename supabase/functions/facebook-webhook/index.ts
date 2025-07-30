import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (req.method === 'GET') {
    // Webhook verification
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('FACEBOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('❌ Verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

      if (body.object === 'page') {
        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              if (messaging.message && messaging.message.text) {
                await handleMessage(messaging, supabase);
              }
            }
          }
        }
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
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
    const aiResponse = await processWithAI(messageText, senderId, supabase);
    
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

async function processWithAI(message: string, senderId: string, supabase: any): Promise<string> {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API Key não encontrada');
      return getFallbackResponse(message, supabase);
    }

    // Buscar produtos disponíveis
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, price, description, image_url')
      .eq('active', true)
      .eq('in_stock', true)
      .limit(25);

    // Construir informações dos produtos (sem imagens por padrão)
    let productsInfo = '';
    if (products && products.length > 0) {
      productsInfo = '\n\nPRODUTOS DISPONÍVEIS:\n';
      products.forEach((product: any, index: number) => {
        const price = parseFloat(product.price).toLocaleString('pt-AO');
        productsInfo += `${index + 1}. ${product.name} - ${price} Kz\n`;
        productsInfo += `   Link: https://superloja.vip/produto/${product.slug}\n\n`;
      });
    }

    // Detectar se usuário quer ver fotos
    const photoKeywords = ['fotos', 'foto', 'imagem', 'imagens', 'envie fotos', 'manda imagem', 'manda imagens', 'quero fotos', 'quero ver', 'mostra foto', 'mostra imagem'];
    const wantsPhotos = photoKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    console.log(`📸 Usuário quer fotos: ${wantsPhotos}`);

    const systemPrompt = `Você é um vendedor angolano inteligente da SuperLoja (https://superloja.vip).

PERSONALIDADE: Amigável, direto, conhece bem os produtos, fala como um angolano real.

${productsInfo}

DETECÇÃO DE FOTOS:
Usuário pediu fotos: ${wantsPhotos}

INSTRUÇÕES CRÍTICAS PARA FONES:
- Quando perguntarem sobre fones, bluetooth ou auriculares, você DEVE mostrar TODOS os produtos relacionados
- Não pode limitar quantidade - deve mostrar os 8-9 fones que temos
- Cada produto deve ter seu próprio número (1, 2, 3, 4, 5, 6, 7, 8, 9)
- NUNCA corte a lista no meio
- NUNCA use frases como "entre outros" ou "e mais"

REGRAS PARA IMAGENS:
${wantsPhotos ? 
  '- INCLUA imagens para TODOS os produtos usando: 📸 ![Imagem](URL_DA_IMAGEM)' :
  '- NÃO inclua imagens a menos que o cliente peça especificamente'
}

FORMATO OBRIGATÓRIO PARA CADA PRODUTO:
X. *[NOME COMPLETO DO PRODUTO]* - [PREÇO EXATO] Kz
   🔗 [Ver produto](https://superloja.vip/produto/[SLUG])
${wantsPhotos ? '   📸 ![Imagem]([URL_DA_IMAGEM])' : ''}

REGRAS ABSOLUTAS:
- Use * para texto em negrito (*produto*)
- Use [Ver produto](URL) para links  
- Numere TODOS os produtos (1., 2., 3., etc.)
- Use preços EXATOS da lista acima
- Mostre a lista COMPLETA de fones - todos os produtos
${wantsPhotos ? '- INCLUA 📸 ![Imagem](URL) para cada produto' : '- NÃO inclua ![Imagem](URL) a menos que cliente peça fotos'}

IMPORTANTE: Temos ${products?.filter((p: any) => p.name.toLowerCase().includes('fone')).length || 9} fones. Mostre TODOS eles quando perguntarem sobre fones!`;

    console.log('🤖 Enviando para OpenAI com instruções para mostrar TODOS os fones...');

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
        max_tokens: 10000,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro OpenAI:', response.status, errorText);
      return getFallbackResponse(message, supabase);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      const aiResponse = data.choices[0].message.content.trim();
      console.log(`✅ Resposta IA gerada - Tamanho: ${aiResponse.length} caracteres`);
      console.log(`📊 Tokens usados: ${data.usage?.total_tokens || 'não disponível'}`);
      console.log(`📝 Tokens completion: ${data.usage?.completion_tokens || 'não disponível'}`);
      
      // Detectar se é confirmação de compra e notificar admin
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('comprei') || lowerMessage.includes('nome:') || 
          lowerMessage.includes('contacto:') || lowerMessage.includes('confirmar')) {
        // Notificar admin em background
        EdgeRuntime.waitUntil(notifyAdmin(senderId, message, supabase));
      }
      
      return aiResponse;
    } else {
      throw new Error('Resposta inválida da OpenAI');
    }

  } catch (error) {
    console.error('❌ Erro processamento IA:', error);
    return getFallbackResponse(message, supabase);
  }
}

async function getFallbackResponse(message: string, supabase: any): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Detectar se usuário quer ver fotos
  const photoKeywords = ['fotos', 'foto', 'imagem', 'imagens', 'envie fotos', 'manda imagem', 'manda imagens', 'quero fotos', 'quero ver', 'mostra foto', 'mostra imagem'];
  const wantsPhotos = photoKeywords.some(keyword => lowerMessage.includes(keyword));
  
  console.log(`📸 Fallback - Usuário quer fotos: ${wantsPhotos}`);
  
  // Buscar produtos por categoria específica
  if (lowerMessage.includes('fone') || lowerMessage.includes('bluetooth') || lowerMessage.includes('auricular')) {
    try {
      const { data: headphones } = await supabase
        .from('products')
        .select('name, slug, price, image_url')
        .eq('active', true)
        .eq('in_stock', true)
        .or('name.ilike.%fone%,name.ilike.%bluetooth%,name.ilike.%auricular%')
        .order('price', { ascending: true });
      
      if (headphones && headphones.length > 0) {
        console.log(`✅ Encontrados ${headphones.length} fones em stock - enviando TODOS`);
        let response = "Claro! Aqui estão todos os fones de ouvido disponíveis na nossa loja:\n\n";
        headphones.forEach((product: any, index: number) => {
          const price = parseFloat(product.price).toLocaleString('pt-AO');
          response += `${index + 1}. *${product.name}* - ${price} Kz\n`;
          response += `   🔗 [Ver produto](https://superloja.vip/produto/${product.slug})\n`;
          
          // Incluir imagem se usuário pediu fotos E produto tem imagem
          if (wantsPhotos && product.image_url) {
            response += `   📸 ![Imagem](${product.image_url})\n`;
          }
          response += "\n";
        });
        
        // Mensagem adicional sobre fotos
        if (wantsPhotos) {
          response += "📸 Fotos incluídas acima! Se alguma não aparecer, é só avisar.\n";
        } else {
          response += "Se quiseres ver as fotos dos produtos, é só pedir! 📸\n";
        }
        
        response += "Qual deles te interessa mais? 😊";
        return response;
      }
    } catch (error) {
      console.error('❌ Erro buscar fones:', error);
    }
  }
  
  return `Olá! Bem-vindo à SuperLoja! 😊 Temos produtos incríveis com entrega grátis. O que procura? 

Visite nosso site: https://superloja.vip`;
}

async function notifyAdmin(customerId: string, customerMessage: string, supabase: any) {
  try {
    console.log('🔔 Notificando admin sobre nova compra...');
    
    // Buscar ID do admin
    const { data: adminData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'admin_facebook_id')
      .single();

    const adminId = adminData?.value || 'carlosfox2';
    
    // Buscar token do Facebook
    const { data: tokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = tokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Token Facebook não encontrado');
      return;
    }

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    const notificationMessage = `🚨 NOVA COMPRA CONFIRMADA! 🚨

👤 Cliente: ${customerId}
💬 Mensagem: "${customerMessage}"

⚡ Entre em contacto com o cliente para finalizar a venda!
🕐 ${new Date().toLocaleString('pt-AO')}`;
    
    const payload = {
      recipient: { id: adminId },
      message: { text: notificationMessage },
      messaging_type: 'MESSAGE_TAG',
      tag: 'BUSINESS_PRODUCTIVITY'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro notificar admin:', response.status, errorText);
    } else {
      console.log('✅ Admin notificado com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
  }
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

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    // Verificar se a mensagem contém imagens
    const imageRegex = /📸 !\[Imagem\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(messageText)) !== null) {
      images.push(match[1]);
    }
    
    // Remover markdown de imagem do texto
    const cleanText = messageText.replace(/📸 !\[Imagem\]\([^)]+\)/g, '').trim();
    
    // Enviar texto primeiro
    if (cleanText) {
      const textPayload = {
        recipient: { id: recipientId },
        message: { text: cleanText },
        messaging_type: 'RESPONSE'
      };

      const textResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textPayload),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('❌ Erro ao enviar texto Facebook:', textResponse.status, errorText);
      } else {
        console.log('✅ Texto enviado para Facebook');
      }
    }
    
    // Enviar imagens como attachments
    for (const imageUrl of images) {
      const imagePayload = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        },
        messaging_type: 'RESPONSE'
      };

      const imageResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imagePayload),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('❌ Erro ao enviar imagem Facebook:', imageResponse.status, errorText);
      } else {
        console.log('✅ Imagem enviada para Facebook');
      }
      
      // Pausa entre envios
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('❌ Erro geral ao enviar mensagem:', error);
  }
}