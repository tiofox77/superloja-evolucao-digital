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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    // STEP 1: Verificar token das configurações Meta
    console.log('📋 STEP 1: Verificando token das configurações Meta...');
    try {
      const { data: metaSettings, error: metaError } = await supabase
        .from('meta_settings')
        .select('access_token')
        .limit(1)
        .maybeSingle();

      debugResults.step1_meta_token = {
        found: !!metaSettings?.access_token,
        token_preview: metaSettings?.access_token ? metaSettings.access_token.substring(0, 20) + '...' : null,
        error: metaError?.message || null
      };

      if (metaSettings?.access_token) {
        debugResults.summary.token_source = 'meta_settings';
        console.log('✅ Token encontrado nas configurações Meta');
      } else {
        console.log('⚠️ Token não encontrado nas configurações Meta');
        debugResults.summary.issues_found.push('Token não encontrado na tabela meta_settings');
      }
    } catch (error) {
      debugResults.step1_meta_token = { error: error.message };
      debugResults.summary.issues_found.push('Erro ao acessar tabela meta_settings: ' + error.message);
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
    if (debugResults.step1_meta_token?.found) {
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
          debug_results: debugResults,
          message: 'Nenhum token Facebook encontrado'
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

    // STEP 5: Verificar permissões para envio de mensagens
    console.log('🔑 STEP 5: Verificando permissões...');
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/me/permissions?access_token=${testToken}`
      );
      const permissionsData = await permissionsResponse.json();
      
      const hasMessagingPermission = permissionsData.data?.some(
        (perm: any) => perm.permission === 'pages_messaging' && perm.status === 'granted'
      );

      debugResults.step5_user_permissions = {
        status: permissionsResponse.status,
        permissions: permissionsData.data || [],
        has_messaging: hasMessagingPermission,
        error: permissionsData.error || null
      };

      if (hasMessagingPermission) {
        debugResults.summary.can_send_messages = true;
        console.log('✅ Permissão de mensagens concedida');
      } else {
        debugResults.summary.issues_found.push('Permissão pages_messaging não encontrada ou não concedida');
        console.log('❌ Permissão de mensagens não encontrada');
      }
    } catch (error) {
      debugResults.step5_user_permissions = { error: error.message };
      debugResults.summary.issues_found.push('Erro ao verificar permissões: ' + error.message);
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
  
  if (issues.some(i => i.includes('meta_settings'))) {
    recommendations.push('Configure o token Facebook na página de Configurações Meta');
  }
  
  if (issues.some(i => i.includes('secrets'))) {
    recommendations.push('Configure FACEBOOK_PAGE_ACCESS_TOKEN nas secrets do Supabase');
  }
  
  if (issues.some(i => i.includes('Token inválido'))) {
    recommendations.push('Gere um novo token de acesso no Facebook Developers');
  }
  
  if (issues.some(i => i.includes('pages_messaging'))) {
    recommendations.push('Solicite a permissão pages_messaging no Facebook App');
  }
  
  if (issues.some(i => i.includes('API inacessível'))) {
    recommendations.push('Verifique se o token tem as permissões corretas');
  }
  
  return recommendations;
}