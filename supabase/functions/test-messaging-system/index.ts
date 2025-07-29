import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧪 Testando sistema de mensagens...');

    // 1. Testar inserção de mensagem de teste
    const testMessage = {
      platform: 'facebook',
      user_id: 'test_user_123',
      message: 'Mensagem de teste do sistema',
      type: 'received',
      timestamp: new Date().toISOString()
    };

    console.log('📝 Inserindo mensagem de teste:', testMessage);

    const { data: insertData, error: insertError } = await supabase
      .from('ai_conversations')
      .insert(testMessage)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir mensagem:', insertError);
      throw insertError;
    }

    console.log('✅ Mensagem de teste inserida:', insertData);

    // 2. Verificar se consegue ler mensagens
    const { data: messages, error: readError } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (readError) {
      console.error('❌ Erro ao ler mensagens:', readError);
      throw readError;
    }

    console.log('📋 Mensagens encontradas:', messages);

    // 3. Testar webhook simulado
    const webhookTestData = {
      entry: [{
        id: '230190170178019',
        time: Date.now(),
        messaging: [{
          sender: { id: 'test_user_webhook' },
          recipient: { id: '230190170178019' },
          timestamp: Date.now(),
          message: {
            mid: 'test_message_id',
            text: 'Teste webhook simulado'
          }
        }]
      }]
    };

    console.log('🔄 Testando webhook com dados simulados...');

    const webhookResponse = await fetch('https://fijbvihinhuedkvkxwir.supabase.co/functions/v1/facebook-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookTestData)
    });

    const webhookResult = await webhookResponse.text();
    console.log('📤 Resposta do webhook:', webhookResponse.status, webhookResult);

    // 4. Verificar mensagens após webhook
    const { data: afterWebhook, error: afterError } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);

    console.log('📋 Mensagens após webhook:', afterWebhook);

    const result = {
      success: true,
      database_test: {
        insert_success: !!insertData,
        messages_count: messages?.length || 0,
        latest_messages: messages
      },
      webhook_test: {
        status_code: webhookResponse.status,
        response: webhookResult,
        messages_after: afterWebhook?.length || 0
      },
      troubleshooting: {
        database_working: !!insertData && !!messages,
        webhook_accessible: webhookResponse.ok,
        messages_processing: (afterWebhook?.length || 0) > (messages?.length || 0)
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});