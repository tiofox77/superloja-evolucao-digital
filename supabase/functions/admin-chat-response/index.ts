import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminChatRequest {
  customer_id: string;
  admin_message: string;
  platform: 'facebook' | 'instagram' | 'website';
  notification_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { customer_id, admin_message, platform, notification_id }: AdminChatRequest = await req.json();

    if (!customer_id || !admin_message) {
      return new Response(
        JSON.stringify({ error: 'customer_id e admin_message são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('📨 Admin enviando resposta:', { customer_id, platform, message_length: admin_message.length });

    // Salvar mensagem do admin na conversa
    await supabase.from('ai_conversations').insert({
      user_id: customer_id,
      message: admin_message,
      type: 'admin',
      platform: platform || 'website',
      timestamp: new Date().toISOString(),
      metadata: {
        sent_by_admin: true,
        notification_id: notification_id
      }
    });

    let deliveryResult = null;

    // Se for Facebook/Instagram, enviar via API do Facebook
    if (platform === 'facebook' || platform === 'instagram') {
      deliveryResult = await sendToFacebookMessenger(customer_id, admin_message, supabase);
    }

    // Marcar notificação como respondida se fornecida
    if (notification_id) {
      await supabase
        .from('admin_notifications')
        .update({ 
          is_sent: true,
          metadata: { 
            admin_responded: true, 
            response_time: new Date().toISOString() 
          }
        })
        .eq('id', notification_id);
    }

    // Criar uma nova entrada de chat para o cliente caso seja website
    if (platform === 'website') {
      // A resposta ficará disponível quando cliente abrir o chat novamente
      console.log('💬 Resposta salva para cliente website');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Resposta enviada com sucesso',
      delivery_status: deliveryResult,
      platform: platform,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Erro ao enviar resposta admin:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

async function sendToFacebookMessenger(customerId: string, message: string, supabase: any) {
  try {
    // Buscar token do Facebook
    const { data: tokenData } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();

    const pageAccessToken = tokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    
    if (!pageAccessToken) {
      console.error('❌ Token Facebook não encontrado');
      return { success: false, error: 'Token não configurado' };
    }

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;
    
    const payload = {
      recipient: { id: customerId },
      message: { 
        text: `📢 RESPOSTA DO ADMIN:\n\n${message}\n\n---\nEquipa SuperLoja` 
      },
      messaging_type: 'RESPONSE'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Mensagem enviada via Facebook:', result);
      return { success: true, facebook_message_id: result.message_id };
    } else {
      console.error('❌ Erro ao enviar via Facebook:', result);
      return { success: false, error: result.error?.message || 'Erro desconhecido' };
    }

  } catch (error) {
    console.error('❌ Erro na função sendToFacebookMessenger:', error);
    return { success: false, error: error.message };
  }
}