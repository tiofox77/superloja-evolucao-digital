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

    // Testar token com Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${page_token}&fields=name,id,category,followers_count,about`
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro Facebook:', data);
      throw new Error(data.error?.message || 'Token inválido');
    }

    console.log(`✅ Página Facebook encontrada: ${data.name}`);

    // Testar permissões de mensagens
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${page_token}`
    );

    const permissionsData = await permissionsResponse.json();
    const hasMessagingPermission = permissionsData.data?.some(
      (perm: any) => perm.permission === 'pages_messaging' && perm.status === 'granted'
    );

    return new Response(JSON.stringify({
      success: true,
      page_name: data.name,
      page_id: data.id,
      page_category: data.category,
      followers_count: data.followers_count,
      about: data.about,
      messaging_permission: hasMessagingPermission,
      permissions: permissionsData.data,
      test_timestamp: new Date().toISOString()
    }), {
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