import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { page_token } = await req.json();

    if (!page_token) {
      throw new Error('Token da página é obrigatório');
    }

    console.log('🧪 Testando token Facebook...');

    // Primeiro, verificar que tipo de token é (usuário ou página)
    const tokenInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${page_token}&fields=id,name`
    );

    const tokenData = await tokenInfoResponse.json();
    
    if (!tokenInfoResponse.ok) {
      console.error('❌ Erro ao verificar token:', tokenData);
      throw new Error(tokenData.error?.message || 'Token inválido');
    }

    console.log('📋 Informações do token:', tokenData);

    // Tentar buscar informações como página
    let pageData = null;
    let isPageToken = false;
    
    try {
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${page_token}&fields=name,id,category,followers_count,about,access_token`
      );
      
      const pageResult = await pageResponse.json();
      
      if (pageResponse.ok && pageResult.category) {
        pageData = pageResult;
        isPageToken = true;
        console.log('✅ Token de página válido:', pageData.name);
      }
    } catch (error) {
      console.log('⚠️  Não é um token de página, verificando se é token de usuário...');
    }

    // Se não for token de página, buscar as páginas do usuário
    if (!isPageToken) {
      const userPagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${page_token}&fields=name,id,category,access_token`
      );
      
      const userPagesData = await userPagesResponse.json();
      
      if (!userPagesResponse.ok) {
        console.error('❌ Erro ao buscar páginas do usuário:', userPagesData);
        throw new Error('Token não tem acesso a páginas ou é inválido');
      }
      
      if (userPagesData.data && userPagesData.data.length > 0) {
        pageData = {
          ...tokenData,
          pages: userPagesData.data,
          total_pages: userPagesData.data.length
        };
        console.log(`✅ Token de usuário com ${userPagesData.data.length} página(s) acessível(eis)`);
      } else {
        throw new Error('Token de usuário não tem acesso a nenhuma página');
      }
    }

    // Testar permissões de mensagens
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${page_token}`
    );

    const permissionsData = await permissionsResponse.json();
    const hasMessagingPermission = permissionsData.data?.some(
      (perm: any) => perm.permission === 'pages_messaging' && perm.status === 'granted'
    );

    const responseData = {
      success: true,
      token_type: isPageToken ? 'page' : 'user',
      messaging_permission: hasMessagingPermission,
      permissions: permissionsData.data,
      test_timestamp: new Date().toISOString(),
      ...(isPageToken ? {
        page_name: pageData.name,
        page_id: pageData.id,
        page_category: pageData.category,
        followers_count: pageData.followers_count,
        about: pageData.about
      } : {
        user_name: pageData.name,
        user_id: pageData.id,
        accessible_pages: pageData.pages,
        total_pages: pageData.total_pages
      })
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro no teste Facebook:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});