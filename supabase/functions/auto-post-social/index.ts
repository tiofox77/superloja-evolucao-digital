import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPostRequest {
  action: 'generate_content' | 'schedule_post' | 'post_now' | 'get_scheduled';
  platform?: 'facebook' | 'instagram' | 'both';
  product_id?: string;
  custom_prompt?: string;
  schedule_time?: string;
  post_type?: 'product' | 'promotional' | 'engagement' | 'custom';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, platform, product_id, custom_prompt, schedule_time, post_type }: AutoPostRequest = await req.json();

    switch (action) {
      case 'generate_content':
        return await generateContent(product_id, post_type, custom_prompt, supabase);
      
      case 'schedule_post':
        return await schedulePost(platform, product_id, custom_prompt, schedule_time, post_type, supabase);
      
      case 'post_now':
        return await postNow(platform, product_id, custom_prompt, post_type, supabase);
      
      case 'get_scheduled':
        return await getScheduledPosts(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

  } catch (error) {
    console.error('Erro no auto-post:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

async function generateContent(product_id?: string, post_type?: string, custom_prompt?: string, supabase?: any) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API Key não configurada');
  }

  let productInfo = '';
  let productData = null;
  
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .eq('id', product_id)
      .single();
    
    if (product) {
      productData = product;
      productInfo = `
PRODUTO:
- Nome: ${product.name}
- Descrição: ${product.description}
- Preço: ${product.price} AOA
- Imagem: ${product.image_url}
`;
    }
  }

  // Gerar banner automaticamente para qualquer post
  let bannerUrl = null;
  if (productData) {
    try {
      bannerUrl = await generateProductBanner(productData, post_type, supabase);
    } catch (error) {
      console.error('Erro ao gerar banner:', error);
    }
  }

  const systemPrompt = `Você é um especialista em marketing digital da SuperLoja Angola, criando posts para Facebook e Instagram.

IDENTIDADE DA MARCA:
- SuperLoja: Loja online líder em Angola
- Especialidade: Eletrônicos, gadgets, smartphones, acessórios
- Tom: Profissional mas descontraído, linguagem angolana moderna
- Público: Jovens e adultos interessados em tecnologia

DIRETRIZES PARA POSTS:
1. Use expressões angolanas naturais mas profissionais
2. Inclua sempre call-to-action
3. Use emojis relevantes mas sem exagero
4. Mencione entrega grátis em Luanda quando relevante
5. Inclua hashtags angolanas e de tecnologia
6. Máximo 280 caracteres para melhor engajamento
7. ${bannerUrl ? 'IMPORTANTE: Uma imagem promocional será anexada automaticamente ao post' : 'Crie um texto atrativo e descritivo'}

TIPOS DE POST:
- product: Foco no produto específico
- promotional: Ofertas e promoções
- engagement: Perguntas e interação
- custom: Baseado no prompt personalizado

${productInfo}

HASHTAGS SUGERIDAS: #SuperLojaAngola #TecnologiaAngola #GadgetsLuanda #EletronicosAngola #EntregaGratis`;

  let userPrompt = '';
  
  switch (post_type) {
    case 'product':
      userPrompt = `Crie um post atrativo para o produto mencionado. Destaque os benefícios principais e chame para ação de compra.`;
      break;
    case 'promotional':
      userPrompt = `Crie um post promocional chamativo. Use linguagem de urgência e benefícios irresistíveis.`;
      break;
    case 'engagement':
      userPrompt = `Crie um post para gerar interação e comentários. Faça uma pergunta interessante relacionada à tecnologia.`;
      break;
    case 'custom':
      userPrompt = custom_prompt || 'Crie um post criativo para redes sociais.';
      break;
    default:
      userPrompt = 'Crie um post engajante para redes sociais.';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0]) {
    const generatedContent = data.choices[0].message.content.trim();
    
    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        banner_url: bannerUrl,
        product_info: productInfo ? 'Produto incluído' : 'Sem produto específico',
        has_banner: !!bannerUrl
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } else {
    throw new Error('Erro ao gerar conteúdo com IA');
  }
}

// Função para gerar banner do produto
async function generateProductBanner(productData: any, postType: string, supabase: any) {
  try {
    // Configurações do banner baseadas no tipo de post
    const bannerConfig = {
      width: 1080,
      height: 1080,
      background: postType === 'promotional' ? '#E86C00' : '#8B4FA3',
      textColor: '#FFFFFF',
      logoEnabled: true
    };

    // Carregar logo da loja
    const { data: storeSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'store_info')
      .single();

    const logoUrl = storeSettings?.value?.logo_url || '';

    // Gerar HTML do banner
    const bannerHtml = createBannerHtml(productData, bannerConfig, postType, logoUrl);
    
    // Para esta implementação server-side, vamos retornar uma URL de placeholder
    // que pode ser processada pelo cliente ou por um serviço de screenshot
    const bannerData = {
      html: bannerHtml,
      config: bannerConfig,
      product: productData,
      type: postType
    };

    // Salvar dados do banner temporariamente
    const { data: bannerRecord } = await supabase
      .from('generated_banners')
      .insert({
        product_id: productData.id,
        banner_data: bannerData,
        post_type: postType,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bannerRecord) {
      // Retornar URL que pode ser usada para gerar a imagem
      return `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-banner/${bannerRecord.id}`;
    }

    return null;
  } catch (error) {
    console.error('Erro ao gerar banner:', error);
    return null;
  }
}

// Função para criar HTML do banner
function createBannerHtml(product: any, config: any, postType: string, logoUrl: string) {
  const promoTag = postType === 'promotional' ? 
    `<div style="background: #FF6B35; color: white; padding: 10px 20px; border-radius: 20px; font-size: 24px; font-weight: bold; position: absolute; top: 80px; right: 40px; transform: rotate(15deg); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">OFERTA ESPECIAL!</div>` : '';

  return `
    <div style="width: ${config.width}px; height: ${config.height}px; background: ${config.background}; color: ${config.textColor}; position: relative; font-family: Arial, sans-serif; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box;">
      ${promoTag}
      
      ${logoUrl ? `<div style="width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2); margin-bottom: 30px;">
        <img src="${logoUrl}" style="max-width: 80px; max-height: 80px; object-fit: contain;" />
      </div>` : ''}
      
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        ${product.image_url ? `<img src="${product.image_url}" style="max-width: 300px; max-height: 300px; object-fit: contain; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); margin-bottom: 30px;" />` : ''}
        
        <h2 style="font-size: 48px; font-weight: bold; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); line-height: 1.2;">${product.name}</h2>
        
        <div style="font-size: 42px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 25px; margin: 20px 0; border: 3px solid ${config.textColor};">${product.price.toLocaleString()} AOA</div>
      </div>
      
      <div style="font-size: 24px; opacity: 0.9; text-align: center;">
        <div style="font-weight: bold; margin-bottom: 5px;">SuperLoja Angola</div>
        <div>Entrega grátis em Luanda • www.superloja.ao</div>
      </div>
    </div>
  `;
}

async function schedulePost(platform?: string, product_id?: string, custom_prompt?: string, schedule_time?: string, post_type?: string, supabase?: any) {
  // Gerar conteúdo primeiro
  const contentResponse = await generateContent(product_id, post_type, custom_prompt, supabase);
  const contentData = await contentResponse.json();
  
  // Salvar post agendado
  const { data: scheduledPost, error } = await supabase
    .from('scheduled_posts')
    .insert({
      platform: platform || 'both',
      content: contentData.content,
      product_id: product_id,
      scheduled_for: schedule_time,
      post_type: post_type || 'custom',
      status: 'scheduled',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Erro ao agendar post: ' + error.message);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      scheduled_post: scheduledPost,
      message: 'Post agendado com sucesso!'
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function postNow(platform?: string, product_id?: string, custom_prompt?: string, post_type?: string, supabase?: any) {
  try {
    console.log('🚀 Iniciando postagem imediata:', { platform, product_id, post_type });
    
    // Gerar conteúdo
    const contentResponse = await generateContent(product_id, post_type, custom_prompt, supabase);
    const contentData = await contentResponse.json();
    
    console.log('📝 Conteúdo gerado:', contentData);
    
    // Postar nas redes sociais
    const results = [];
    
    if (platform === 'facebook' || platform === 'both') {
      try {
        console.log('📘 Postando no Facebook...');
        const facebookResult = await postToFacebook(contentData.content, product_id, supabase);
        results.push({ platform: 'facebook', ...facebookResult });
        console.log('✅ Facebook result:', facebookResult);
      } catch (error) {
        console.error('❌ Erro no Facebook:', error);
        results.push({ platform: 'facebook', success: false, error: error.message });
      }
    }
    
    if (platform === 'instagram' || platform === 'both') {
      try {
        console.log('📷 Postando no Instagram...');
        const instagramResult = await postToInstagram(contentData.content, product_id, supabase);
        results.push({ platform: 'instagram', ...instagramResult });
        console.log('✅ Instagram result:', instagramResult);
      } catch (error) {
        console.error('❌ Erro no Instagram:', error);
        results.push({ platform: 'instagram', success: false, error: error.message });
      }
    }

    // Salvar histórico
    console.log('💾 Salvando histórico...');
    const { error: historyError } = await supabase
      .from('social_posts_history')
      .insert({
        platform: platform,
        content: contentData.content,
        product_id: product_id,
        post_type: post_type,
        results: results,
        posted_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('❌ Erro ao salvar histórico:', historyError);
    } else {
      console.log('✅ Histórico salvo com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        content: contentData.content,
        results: results,
        banner_url: contentData.banner_url
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('❌ Erro geral em postNow:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}

async function postToFacebook(content: string, product_id?: string, supabase?: any) {
  console.log('🔍 [FACEBOOK DEBUG] Iniciando postagem...');
  
  // Buscar configurações do banco de dados
  const { data: settings, error: settingsError } = await supabase
    .from('social_media_settings')
    .select('settings')
    .eq('platform', 'facebook')
    .eq('is_active', true)
    .single();
  
  console.log('🔍 [FACEBOOK DEBUG] Configurações encontradas:', {
    hasSettings: !!settings,
    settingsError,
    hasAccessToken: !!settings?.settings?.access_token,
    hasPageId: !!settings?.settings?.page_id,
    tokenPrefix: settings?.settings?.access_token?.substring(0, 10) + '...',
    pageId: settings?.settings?.page_id
  });
  
  if (!settings?.settings?.access_token || !settings?.settings?.page_id) {
    throw new Error('Token do Facebook não configurado');
  }
  
  const FACEBOOK_PAGE_ACCESS_TOKEN = settings.settings.access_token;
  const FACEBOOK_PAGE_ID = settings.settings.page_id;

  let postData: any = {
    message: content,
    access_token: FACEBOOK_PAGE_ACCESS_TOKEN
  };

  // Adicionar imagem se houver produto
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', product_id)
      .single();
    
    if (product?.image_url && !product.image_url.includes('supabase.co')) {
      postData.link = product.image_url;
    }
  }

  // Primeiro obter o Page Access Token usando o User Token
  console.log('🔍 [FACEBOOK DEBUG] Obtendo Page Token...');
  const pageTokenResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`);
  const pageTokenData = await pageTokenResponse.json();
  
  console.log('🔍 [FACEBOOK DEBUG] Resposta das páginas:', {
    success: pageTokenResponse.ok,
    hasData: !!pageTokenData.data,
    pagesCount: pageTokenData.data?.length,
    targetPageId: FACEBOOK_PAGE_ID
  });
  
  if (!pageTokenResponse.ok || pageTokenData.error) {
    console.error('❌ [FACEBOOK DEBUG] Erro ao obter páginas:', pageTokenData.error);
    throw new Error('Erro ao obter páginas: ' + JSON.stringify(pageTokenData.error));
  }
  
  const pageInfo = pageTokenData.data?.find((page: any) => page.id === FACEBOOK_PAGE_ID);
  if (!pageInfo) {
    console.error('❌ [FACEBOOK DEBUG] Página não encontrada. Páginas disponíveis:', pageTokenData.data?.map((p: any) => ({ id: p.id, name: p.name })));
    throw new Error('Página não encontrada ou sem acesso');
  }
  
  console.log('✅ [FACEBOOK DEBUG] Página encontrada:', { name: pageInfo.name, hasToken: !!pageInfo.access_token });
  
  // Usar o Page Access Token para postar
  postData.access_token = pageInfo.access_token;
  
  const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(postData).toString()
  });

  const result = await response.json();
  
  if (response.ok) {
    return { success: true, post_id: result.id };
  } else {
    throw new Error('Erro no Facebook: ' + JSON.stringify(result));
  }
}

async function postToInstagram(content: string, product_id?: string, supabase?: any) {
  console.log('🔍 [INSTAGRAM DEBUG] Iniciando postagem...');
  
  // Buscar configurações do banco de dados
  const { data: settings, error: settingsError } = await supabase
    .from('social_media_settings')
    .select('settings')
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();
  
  console.log('🔍 [INSTAGRAM DEBUG] Configurações encontradas:', {
    hasSettings: !!settings,
    settingsError,
    hasAccessToken: !!settings?.settings?.access_token,
    hasBusinessId: !!settings?.settings?.business_id,
    tokenPrefix: settings?.settings?.access_token?.substring(0, 10) + '...',
    businessId: settings?.settings?.business_id
  });
  
  if (!settings?.settings?.access_token || !settings?.settings?.business_id) {
    throw new Error('Credenciais do Instagram não configuradas');
  }
  
  const INSTAGRAM_ACCESS_TOKEN = settings.settings.access_token;
  const INSTAGRAM_BUSINESS_ID = settings.settings.business_id;

  // Instagram requer imagem para posts
  let imageUrl = 'https://fijbvihinhuedkvkxwir.supabase.co/storage/v1/object/public/product-images/default-post.jpg';
  
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', product_id)
      .single();
    
    if (product?.image_url) {
      imageUrl = product.image_url;
    }
  }

  // Criar container de mídia
  const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      image_url: imageUrl,
      caption: content,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }).toString()
  });

  const containerResult = await containerResponse.json();
  
  if (!containerResponse.ok) {
    throw new Error('Erro ao criar container Instagram: ' + JSON.stringify(containerResult));
  }

  // Publicar o container
  const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_BUSINESS_ID}/media_publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      creation_id: containerResult.id,
      access_token: INSTAGRAM_ACCESS_TOKEN
    }).toString()
  });

  const publishResult = await publishResponse.json();
  
  if (publishResponse.ok) {
    return { success: true, post_id: publishResult.id };
  } else {
    throw new Error('Erro ao publicar no Instagram: ' + JSON.stringify(publishResult));
  }
}

async function getScheduledPosts(supabase: any) {
  const { data: scheduledPosts, error } = await supabase
    .from('scheduled_posts')
    .select(`
      *,
      products(name, image_url)
    `)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error('Erro ao buscar posts agendados: ' + error.message);
  }

  return new Response(
    JSON.stringify({ scheduled_posts: scheduledPosts }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}