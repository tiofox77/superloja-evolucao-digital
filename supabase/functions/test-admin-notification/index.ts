import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Função test-admin-notification iniciada');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Tentando ler body da requisição...');
    
    let body = {};
    try {
      const bodyText = await req.text();
      console.log('📝 Body raw:', bodyText);
      
      if (bodyText) {
        body = JSON.parse(bodyText);
        console.log('📋 Body parsed:', body);
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do body:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao fazer parse do JSON: ' + parseError.message,
        receivedBody: bodyText || 'empty'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { customerMessage = "Teste de notificação", customerId = "24279509458374902", adminId = "24320548907583618" } = body;
    
    console.log('🔔 === TESTE DE NOTIFICAÇÃO ADMIN ===');
    console.log('Admin ID:', adminId);
    console.log('Cliente:', customerId);
    console.log('Mensagem:', customerMessage);
    
    // Criar cliente Supabase para buscar token do banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('🔍 Buscando token do Facebook no banco de dados...');
    
    // Buscar token do Facebook no banco
    const { data: tokenData, error: tokenError } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_token')
      .single();
    
    console.log('📋 Resultado da busca do token:', { tokenData, tokenError });
    
    // Fallback para variável de ambiente se não encontrar no banco
    let pageAccessToken = tokenData?.value || Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    console.log('Token disponível:', pageAccessToken ? 'SIM' : 'NÃO');
    
    if (!pageAccessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token do Facebook não encontrado',
        diagnosis: 'Token não configurado nem no banco nem nas variáveis de ambiente',
        instructions: [
          '🔧 SOLUÇÃO 1 - Configurar no Banco (RECOMENDADO):',
          '1. Vá para Admin → Agente IA → Configurações',
          '2. Na seção "Integração Facebook"',
          '3. Cole seu token da página Facebook',
          '4. Clique em "Salvar Configurações"',
          '',
          '🔧 SOLUÇÃO 2 - Variáveis de Ambiente:',
          '1. Acesse: https://supabase.com/dashboard/project/fijbvihinhuedkvkxwir/settings/functions',
          '2. Adicione: FACEBOOK_PAGE_ACCESS_TOKEN',
          '3. Valor: Seu token da página Facebook'
        ],
        nextSteps: [
          'Configure o token usando uma das soluções acima',
          'Execute o teste novamente',
          'Verifique se o token tem permissão "pages_messaging"'
        ]
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    
    const testMessage = `🧪 TESTE DE NOTIFICAÇÃO! 🧪

👤 Cliente: ${customerId}
💬 Mensagem: "${customerMessage}"

🔔 Se você recebeu esta mensagem, o sistema de notificações está funcionando!

⏰ ${new Date().toLocaleString('pt-AO')}

📋 Próximos passos:
1. ✅ Sistema funcionando
2. 🤖 Bot irá notificar automaticamente sobre vendas
3. 📱 Fique atento às mensagens urgentes`;
    
    // Diferentes métodos de envio para testar
    const methods = [
      {
        name: 'RESPONSE (Recomendado)',
        payload: {
          recipient: { id: adminId },
          message: { text: testMessage },
          messaging_type: 'RESPONSE'
        }
      },
      {
        name: 'UPDATE',
        payload: {
          recipient: { id: adminId },
          message: { text: testMessage },
          messaging_type: 'UPDATE'
        }
      },
      {
        name: 'MESSAGE_TAG',
        payload: {
          recipient: { id: adminId },
          message: { text: testMessage },
          messaging_type: 'MESSAGE_TAG',
          tag: 'BUSINESS_PRODUCTIVITY'
        }
      }
    ];

    const results = [];
    let successfulMethod = null;

    for (const method of methods) {
      console.log(`📤 Testando método: ${method.name}`);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(method.payload),
        });

        const responseText = await response.text();
        let responseJson;
        
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = { raw: responseText };
        }
        
        const result = {
          method: method.name,
          status: response.status,
          success: response.ok,
          response: responseJson,
          error: response.ok ? null : responseJson.error || responseText
        };
        
        results.push(result);

        if (response.ok) {
          console.log(`✅ Sucesso com método: ${method.name}`);
          successfulMethod = method.name;
          break; // Se funcionar, para de tentar
        } else {
          console.log(`❌ Falha com método: ${method.name} - Status: ${response.status}`);
          console.log('Erro:', responseJson.error || responseText);
        }
      } catch (error) {
        console.error(`❌ Erro com método ${method.name}:`, error);
        results.push({
          method: method.name,
          status: 0,
          success: false,
          response: null,
          error: error.message
        });
      }
      
      // Pausa entre tentativas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Preparar instruções baseadas nos resultados
    let instructions = [];
    let diagnosis = '';

    if (successfulMethod) {
      diagnosis = `✅ Sistema funcionando! Método ${successfulMethod} teve sucesso.`;
      instructions = [
        '🎉 Parabéns! O sistema de notificações está funcionando corretamente.',
        '🤖 O bot irá notificar automaticamente quando clientes confirmarem compras.',
        '📱 Certifique-se de que o Facebook Messenger está aberto para receber notificações.',
        '⚙️ Configure o webhook do Facebook se ainda não foi feito.'
      ];
    } else {
      diagnosis = '❌ Nenhum método funcionou. Verificar configurações.';
      
      // Diagnóstico detalhado
      const hasPermissionError = results.some(r => 
        r.error && (
          r.error.message?.includes('permission') ||
          r.error.message?.includes('access') ||
          r.error.code === 10
        )
      );
      
      const hasInvalidUser = results.some(r => 
        r.error && (
          r.error.message?.includes('Invalid user ID') ||
          r.error.code === 100
        )
      );

      if (hasPermissionError) {
        instructions = [
          '🔑 PROBLEMA: Token sem permissões adequadas',
          '📋 Soluções:',
          '1. Gere um novo token da página no Facebook Developers',
          '2. Certifique-se de incluir a permissão "pages_messaging"',
          '3. O token deve ser da PÁGINA, não do usuário',
          '4. Atualize a secret FACEBOOK_PAGE_ACCESS_TOKEN no Supabase'
        ];
      } else if (hasInvalidUser) {
        instructions = [
          '👤 PROBLEMA: ID do admin não válido',
          '📋 Soluções:',
          '1. Verifique se "carlosfox2" é o ID correto do Facebook',
          '2. O ID deve ser o ID único do Facebook, não o nome de usuário',
          '3. Teste primeiro enviando mensagem do usuário para a página',
          '4. Use o ID que aparece nas conversas recebidas'
        ];
      } else {
        instructions = [
          '🔧 PROBLEMA: Configuração geral',
          '📋 Verificar:',
          '1. Token da página Facebook está correto?',
          '2. Página está em modo "Ativo" ou "Desenvolvedor"?',
          '3. Webhook está configurado corretamente?',
          '4. ID do admin está correto?'
        ];
      }
    }

    return new Response(JSON.stringify({
      success: !!successfulMethod,
      diagnosis,
      successfulMethod,
      adminId,
      testMessage: testMessage.substring(0, 200) + '...',
      attempts: results,
      instructions,
      timestamp: new Date().toISOString(),
      nextSteps: successfulMethod ? [
        'Sistema funcionando! 🎉',
        'Bot notificará automaticamente sobre vendas',
        'Monitore a aba "Tempo Real" para ver atividade'
      ] : [
        'Siga as instruções acima para corrigir o problema',
        'Execute o teste novamente após as correções',
        'Entre em contacto com suporte se problema persistir'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no teste de notificação:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      instructions: [
        'Erro interno no sistema de teste',
        'Verifique as configurações do Supabase',
        'Certifique-se de que a edge function está funcionando'
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});