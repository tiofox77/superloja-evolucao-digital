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

    console.log('🧪 TESTE NOTIFICAÇÃO ADMIN INICIADO');

    // Simular dados de teste
    const testUserId = 'test_user_12345';
    const testMessage = 'comprei os fones bluetooth';
    const testProducts = [
      { name: 'Fones Bluetooth', price: 7500 },
      { name: 'Mouse Sem Fio', price: 5000 }
    ];

    // 1. Verificar configurações
    console.log('📋 1. VERIFICANDO CONFIGURAÇÕES...');
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('key, value')
      .in('key', ['admin_facebook_id', 'facebook_page_token']);

    console.log('📋 Configurações encontradas:', settings);
    
    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError);
      throw new Error(`Erro configurações: ${settingsError.message}`);
    }

    const adminId = settings?.find(s => s.key === 'admin_facebook_id')?.value;
    const pageToken = settings?.find(s => s.key === 'facebook_page_token')?.value;

    console.log(`👤 Admin ID: ${adminId || 'NÃO ENCONTRADO'}`);
    console.log(`🔑 Page Token: ${pageToken ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

    if (!adminId) {
      throw new Error('Admin Facebook ID não configurado');
    }

    if (!pageToken) {
      throw new Error('Facebook Page Token não encontrado');
    }

    // 2. Salvar notificação no banco
    console.log('💾 2. SALVANDO NOTIFICAÇÃO NO BANCO...');
    const { data: notificationData, error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        admin_user_id: adminId,
        notification_type: 'purchase_confirmation_test',
        message: `🧪 TESTE: Cliente ${testUserId} confirmou compra: "${testMessage}"`,
        metadata: {
          user_id: testUserId,
          original_message: testMessage,
          test: true,
          timestamp: new Date().toISOString()
        }
      });

    if (notificationError) {
      console.error('❌ Erro ao salvar notificação:', notificationError);
      throw new Error(`Erro banco: ${notificationError.message}`);
    }

    console.log('✅ Notificação salva no banco:', notificationData);

    // 3. Testar envio para Facebook
    console.log('📱 3. TESTANDO ENVIO FACEBOOK...');
    const facebookResult = await testFacebookSend(adminId, testUserId, testMessage, testProducts, pageToken);

    // 4. Resultado final
    const result = {
      success: true,
      adminId: adminId,
      hasPageToken: !!pageToken,
      notificationSaved: !notificationError,
      facebookSent: facebookResult.success,
      facebookError: facebookResult.error,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 RESULTADO FINAL:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testFacebookSend(adminId: string, customerId: string, customerMessage: string, products: any[], pageToken: string) {
  try {
    console.log(`📤 Enviando para Facebook - Admin: ${adminId}`);

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`;
    
    const testMessage = `🧪 TESTE DE NOTIFICAÇÃO!\n\n👤 Cliente teste: ${customerId}\n💬 Disse: "${customerMessage}"\n\n📦 Produtos:\n${products.map((p: any) => `• ${p.name} - ${p.price} Kz`).join('\n')}\n\n🕐 ${new Date().toLocaleString('pt-AO')}\n\n✅ Se você recebeu esta mensagem, a notificação está funcionando!`;
    
    console.log('📝 Mensagem de teste:', testMessage.substring(0, 100) + '...');

    // Tentar com MESSAGE_TAG primeiro
    const payload1 = {
      recipient: { id: adminId },
      message: { text: testMessage },
      messaging_type: 'MESSAGE_TAG',
      tag: 'BUSINESS_PRODUCTIVITY'
    };

    console.log('📦 Tentativa 1: MESSAGE_TAG + BUSINESS_PRODUCTIVITY');
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload1),
    });

    console.log('📡 Resposta 1:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso com MESSAGE_TAG!', data);
      return { success: true, method: 'MESSAGE_TAG' };
    }

    const error1 = await response.text();
    console.log('❌ Falhou com MESSAGE_TAG:', error1);

    // Tentar com RESPONSE
    console.log('📦 Tentativa 2: RESPONSE');
    const payload2 = {
      recipient: { id: adminId },
      message: { text: testMessage },
      messaging_type: 'RESPONSE'
    };

    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload2),
    });

    console.log('📡 Resposta 2:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso com RESPONSE!', data);
      return { success: true, method: 'RESPONSE' };
    }

    const error2 = await response.text();
    console.log('❌ Falhou com RESPONSE:', error2);

    return { 
      success: false, 
      error: `MESSAGE_TAG: ${error1}, RESPONSE: ${error2}` 
    };

  } catch (error) {
    console.error('❌ Erro no teste Facebook:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}