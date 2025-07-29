import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page_token, page_id } = await req.json();
    
    if (!page_token || !page_id) {
      throw new Error('page_token e page_id são obrigatórios');
    }

    console.log(`🔧 Configurando webhook para página ${page_id}`);

    // 1. Verificar permissões atuais
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${page_token}`
    );
    const permissions = await permissionsResponse.json();
    
    console.log('📋 Permissões atuais:', permissions);

    // 2. Verificar detalhes da página
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}?fields=name,category,verification_status&access_token=${page_token}`
    );
    const pageInfo = await pageResponse.json();
    
    console.log('📄 Info da página:', pageInfo);

    // 3. Verificar se a página já está subscrita aos webhooks
    const subscriptionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/subscribed_apps?access_token=${page_token}`
    );
    const subscriptions = await subscriptionsResponse.json();
    
    console.log('🔗 Subscrições atuais:', subscriptions);

    // 4. Subscrever a página aos webhooks se não estiver
    let subscriptionResult = null;
    
    if (subscriptions.data && subscriptions.data.length === 0) {
      console.log('📝 Subscrevendo página aos webhooks...');
      
      const subscribeResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page_id}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: page_token,
            subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
          })
        }
      );
      
      subscriptionResult = await subscribeResponse.json();
      console.log('✅ Resultado da subscrição:', subscriptionResult);
    } else {
      console.log('✅ Página já subscrita aos webhooks');
    }

    // 5. Verificar webhook settings novamente
    const finalSubscriptionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}/subscribed_apps?access_token=${page_token}`
    );
    const finalSubscriptions = await finalSubscriptionsResponse.json();

    const result = {
      success: true,
      page_info: pageInfo,
      permissions: permissions,
      initial_subscriptions: subscriptions,
      subscription_result: subscriptionResult,
      final_subscriptions: finalSubscriptions,
      webhook_url: 'https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook',
      instructions: [
        '1. Certifique-se de que sua página está verificada no Facebook',
        '2. O webhook deve estar configurado na aplicação Facebook',
        '3. A página deve estar subscrita aos eventos de mensagens',
        '4. Teste enviando uma mensagem para a página'
      ]
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      troubleshooting: [
        'Verifique se o token da página tem permissões corretas',
        'Confirme se a aplicação Facebook está aprovada',
        'Certifique-se de que a página está vinculada à aplicação',
        'Teste o webhook manualmente no Facebook Developer Console'
      ]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});