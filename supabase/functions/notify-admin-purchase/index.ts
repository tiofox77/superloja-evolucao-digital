import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, message, products } = await req.json();

    console.log(`🔔 Notificando admin sobre compra de usuário ${userId}`);

    // Salvar notificação no banco
    await supabase.from('admin_notifications').insert({
      admin_user_id: 'carlosfox2',
      notification_type: 'purchase_confirmation',
      message: `🛒 COMPRA CONFIRMADA!\n\nUsuário: ${userId}\nMensagem: "${message}"\n\nProdutos visualizados:\n${products.slice(0, 3).map((p: any) => `- ${p.name} (${p.price} Kz)`).join('\n')}`,
      metadata: {
        user_id: userId,
        original_message: message,
        products_count: products.length,
        timestamp: new Date().toISOString()
      }
    });

    // Tentar enviar mensagem para carlosfox2 via Facebook
    try {
      await sendFacebookNotification('carlosfox2', userId, message, products, supabase);
      console.log('✅ Notificação Facebook enviada para carlosfox2');
    } catch (error) {
      console.error('❌ Erro ao enviar para Facebook:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na notificação admin:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendFacebookNotification(adminUserId: string, customerId: string, customerMessage: string, products: any[], supabase: any) {
  const { data: pageTokenData } = await supabase
    .from('ai_settings')
    .select('value')
    .eq('key', 'facebook_page_token')
    .single();

  const pageAccessToken = pageTokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  
  if (!pageAccessToken) {
    throw new Error('Facebook Page Access Token não encontrado');
  }

  // Buscar ID real do Facebook para carlosfox2
  const { data: adminSettings } = await supabase
    .from('ai_settings')
    .select('value')
    .eq('key', 'admin_facebook_id')
    .single();

  const realAdminId = adminSettings?.value || adminUserId;

  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
  
  const notificationMessage = `🚨 NOVA COMPRA DETECTADA! 🚨\n\n👤 Cliente: ${customerId}\n💬 Disse: "${customerMessage}"\n\n📦 Produtos interessantes:\n${products.slice(0, 3).map((p: any) => `• ${p.name} - ${p.price} Kz`).join('\n')}\n\n🕐 ${new Date().toLocaleString('pt-AO')}`;
  
  const payload = {
    recipient: { id: realAdminId },
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
    throw new Error(`Facebook API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}