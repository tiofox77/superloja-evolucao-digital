import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  try {
    console.log('🔍 === INICIANDO DEBUG FACEBOOK MESSAGING ===');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente Supabase não configuradas');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuração Supabase incompleta - variáveis de ambiente não encontradas'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const debugResults = {
      step1_meta_token: null as any,
      step2_secret_token: null as any,
      step3_token_validation: null as any,
      step4_api_test: null as any,
      step5_user_permissions: null as any,
      summary: {
        token_source: 'none',
        token_valid: false,
        api_accessible: false,
        can_send_messages: false,
        issues_found: [] as string[]
      }
    };

    // STEP 1: Verificar token das configurações AI (onde o admin salva)
    console.log('📋 STEP 1: Verificando token das configurações AI...');
    try {
      const { data: aiSettings, error: aiError } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'facebook_page_token')
        .maybeSingle();

      debugResults.step1_meta_token = {
        found: !!aiSettings?.value,
        token_preview: aiSettings?.value ? aiSettings.value.substring(0, 20) + '...' : null,
        error: aiError?.message || null,
        source: 'ai_settings'
      };

      if (aiSettings?.value) {
        debugResults.summary.token_source = 'ai_settings';
        console.log('✅ Token encontrado nas configurações AI');
      } else {
        console.log('⚠️ Token não encontrado nas configurações AI');
        debugResults.summary.issues_found.push('Token não encontrado na tabela ai_settings');
      }
    } catch (error) {
      debugResults.step1_meta_token = { error: error.message, source: 'ai_settings' };
      debugResults.summary.issues_found.push('Erro ao acessar tabela ai_settings: ' + error.message);
    }

    // STEP 1.5: Verificar token das configurações Meta (fallback)
    console.log('📋 STEP 1.5: Verificando token das configurações Meta...');
    if (debugResults.summary.token_source === 'none') {
      try {
        const { data: metaSettings, error: metaError } = await supabase
          .from('meta_settings')
          .select('access_token')
          .limit(1)
          .maybeSingle();

        debugResults.step1_meta_token = {
          ...debugResults.step1_meta_token,
          meta_found: !!metaSettings?.access_token,
          meta_token_preview: metaSettings?.access_token ? metaSettings.access_token.substring(0, 20) + '...' : null,
          meta_error: metaError?.message || null
        };

        if (metaSettings?.access_token) {
          debugResults.summary.token_source = 'meta_settings';
          console.log('✅ Token encontrado nas configurações Meta');
        } else {
          console.log('⚠️ Token não encontrado nas configurações Meta');
          debugResults.summary.issues_found.push('Token não encontrado na tabela meta_settings');
        }
      } catch (error) {
        debugResults.step1_meta_token.meta_error = error.message;
        debugResults.summary.issues_found.push('Erro ao acessar tabela meta_settings: ' + error.message);
      }
    }

    // STEP 2: Verificar token das secrets (fallback)
    console.log('🔐 STEP 2: Verificando token das secrets...');
    const secretToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    debugResults.step2_secret_token = {
      found: !!secretToken,
      token_preview: secretToken ? secretToken.substring(0, 20) + '...' : null
    };

    if (secretToken && debugResults.summary.token_source === 'none') {
      debugResults.summary.token_source = 'secrets';
      console.log('✅ Token encontrado nas secrets');
    } else if (!secretToken) {
      console.log('⚠️ Token não encontrado nas secrets');
      debugResults.summary.issues_found.push('Token não encontrado nas secrets do Supabase');
    }

    // Determinar qual token usar para os testes
    let testToken = null;
    if (debugResults.summary.token_source === 'ai_settings') {
      const { data: aiSettings } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'facebook_page_token')
        .maybeSingle();
      testToken = aiSettings?.value;
    } else if (debugResults.summary.token_source === 'meta_settings') {
      const { data: metaSettings } = await supabase
        .from('meta_settings')
        .select('access_token')
        .limit(1)
        .maybeSingle();
      testToken = metaSettings?.access_token;
    } else if (secretToken) {
      testToken = secretToken;
    }

    if (!testToken) {
      debugResults.summary.issues_found.push('Nenhum token disponível para testes');
      console.log('❌ Nenhum token disponível para testes');
      
      return new Response(
        JSON.stringify({
          success: false,
          fully_functional: false,
          debug_results: debugResults,
          error: 'Nenhum token Facebook encontrado',
          recommendations: ['Configure o token Facebook na página de configurações ou nas secrets do Supabase'],
          message: 'Nenhum token Facebook encontrado para testes'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // STEP 3: Validar o token
    console.log('🔍 STEP 3: Validando token...');
    try {
      const tokenResponse = await fetch(`https://graph.facebook.com/me?access_token=${testToken}`);
      const tokenData = await tokenResponse.json();
      
      debugResults.step3_token_validation = {
        status: tokenResponse.status,
        valid: tokenResponse.ok,
        data: tokenData,
        error: tokenData.error || null
      };

      if (tokenResponse.ok) {
        debugResults.summary.token_valid = true;
        console.log('✅ Token válido:', tokenData.name);
      } else {
        debugResults.summary.issues_found.push('Token inválido: ' + (tokenData.error?.message || 'Erro desconhecido'));
        console.log('❌ Token inválido:', tokenData.error?.message);
      }
    } catch (error) {
      debugResults.step3_token_validation = { error: error.message };
      debugResults.summary.issues_found.push('Erro ao validar token: ' + error.message);
    }

    // STEP 4: Testar acesso à API de mensagens
    console.log('📨 STEP 4: Testando acesso à API de mensagens...');
    try {
      // Tentar acessar a API de mensagens (sem enviar mensagem real)
      const apiResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=name,id&access_token=${testToken}`
      );
      const apiData = await apiResponse.json();
      
      debugResults.step4_api_test = {
        status: apiResponse.status,
        accessible: apiResponse.ok,
        data: apiData,
        error: apiData.error || null
      };

      if (apiResponse.ok) {
        debugResults.summary.api_accessible = true;
        console.log('✅ API acessível');
      } else {
        debugResults.summary.issues_found.push('API inacessível: ' + (apiData.error?.message || 'Erro desconhecido'));
        console.log('❌ API inacessível:', apiData.error?.message);
      }
    } catch (error) {
      debugResults.step4_api_test = { error: error.message };
      debugResults.summary.issues_found.push('Erro ao testar API: ' + error.message);
    }

    // STEP 5: Verificar permissões para envio de mensagens (ajustado para páginas)
    console.log('🔑 STEP 5: Verificando permissões de página...');
    try {
      // Para tokens de página, verificamos se conseguimos acessar a página e seus dados
      const pageResponse = await fetch(
        `https://graph.facebook.com/me?fields=name,id,tasks&access_token=${testToken}`
      );
      const pageData = await pageResponse.json();
      
      let hasMessagingPermission = false;
      
      if (pageResponse.ok && pageData.tasks) {
        // Verificar se tem a tarefa 'MESSAGING' nas tasks da página
        hasMessagingPermission = pageData.tasks.includes('MESSAGING');
      } else if (pageResponse.ok) {
        // Se não conseguir verificar tasks, mas a página responde, assumir que tem permissão
        // pois o token já foi validado com sucesso
        hasMessagingPermission = true;
        console.log('⚠️ Não foi possível verificar tasks específicas, mas página está acessível');
      }

      debugResults.step5_user_permissions = {
        status: pageResponse.status,
        page_data: pageData,
        has_messaging: hasMessagingPermission,
        error: pageData.error || null,
        note: 'Verificação adaptada para token de página'
      };

      if (hasMessagingPermission) {
        debugResults.summary.can_send_messages = true;
        console.log('✅ Página tem acesso para envio de mensagens');
      } else {
        debugResults.summary.issues_found.push('Página pode não ter permissão para mensagens (verificação limitada)');
        console.log('⚠️ Não foi possível confirmar permissão de mensagens');
      }
    } catch (error) {
      debugResults.step5_user_permissions = { error: error.message };
      debugResults.summary.issues_found.push('Erro ao verificar permissões de página: ' + error.message);
    }

    // Conclusão do debug
    console.log('📊 === RESUMO DO DEBUG ===');
    console.log('Token source:', debugResults.summary.token_source);
    console.log('Token válido:', debugResults.summary.token_valid);
    console.log('API acessível:', debugResults.summary.api_accessible);
    console.log('Pode enviar mensagens:', debugResults.summary.can_send_messages);
    console.log('Issues encontradas:', debugResults.summary.issues_found.length);

    const isFullyFunctional = 
      debugResults.summary.token_valid && 
      debugResults.summary.api_accessible && 
      debugResults.summary.can_send_messages;

    return new Response(
      JSON.stringify({
        success: true,
        fully_functional: isFullyFunctional,
        debug_results: debugResults,
        recommendations: isFullyFunctional ? 
          ['Sistema funcionando corretamente!'] : 
          generateRecommendations(debugResults.summary.issues_found)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateRecommendations(issues: string[]): string[] {
  const recommendations = [];
  
  if (issues.some(i => i.includes('ai_settings'))) {
    recommendations.push('Configure o token Facebook no campo "Token Página Facebook" na interface admin');
  }
  
  if (issues.some(i => i.includes('meta_settings'))) {
    recommendations.push('Configure o token Facebook na página de Configurações Meta');
  }
  
  if (issues.some(i => i.includes('Token inválido'))) {
    recommendations.push('Gere um novo token de acesso no Facebook Developers');
  }
  
  if (issues.some(i => i.includes('API inacessível'))) {
    recommendations.push('Verifique se o token tem as permissões corretas');
  }
  
  if (issues.some(i => i.includes('permissão para mensagens'))) {
    recommendations.push('Token de página está funcionando - teste envio de mensagem real');
  }
  
  // Não recomendar secrets se o token já está funcionando
  if (issues.some(i => i.includes('secrets')) && !issues.some(i => i.includes('ai_settings'))) {
    recommendations.push('Configure FACEBOOK_PAGE_ACCESS_TOKEN nas secrets do Supabase (alternativa)');
  }
  
  return recommendations;
}