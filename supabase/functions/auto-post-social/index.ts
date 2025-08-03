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
  if (product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name, description, price, image_url')
      .eq('id', product_id)
      .single();
    
    if (product) {
      productInfo = `
PRODUTO:
- Nome: ${product.name}
- Descrição: ${product.description}
- Preço: ${product.price} AOA
- Imagem: ${product.image_url}
`;
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
        product_info: productInfo ? 'Produto incluído' : 'Sem produto específico'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } else {
    throw new Error('Erro ao gerar conteúdo com IA');
  }
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
  // Gerar conteúdo
  const contentResponse = await generateContent(product_id, post_type, custom_prompt, supabase);
  const contentData = await contentResponse.json();
  
  // Postar nas redes sociais
  const results = [];
  
  if (platform === 'facebook' || platform === 'both') {
    try {
      const facebookResult = await postToFacebook(contentData.content, product_id, supabase);
      results.push({ platform: 'facebook', ...facebookResult });
    } catch (error) {
      results.push({ platform: 'facebook', success: false, error: error.message });
    }
  }
  
  if (platform === 'instagram' || platform === 'both') {
    try {
      const instagramResult = await postToInstagram(contentData.content, product_id, supabase);
      results.push({ platform: 'instagram', ...instagramResult });
    } catch (error) {
      results.push({ platform: 'instagram', success: false, error: error.message });
    }
  }

  // Salvar histórico
  await supabase
    .from('social_posts_history')
    .insert({
      platform: platform,
      content: contentData.content,
      product_id: product_id,
      post_type: post_type,
      results: results,
      posted_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({ 
      success: true,
      content: contentData.content,
      results: results
    }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function postToFacebook(content: string, product_id?: string, supabase?: any) {
  const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
  const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID') || '230190170178019';
  
  if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error('Token do Facebook não configurado');
  }

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
    
    if (product?.image_url) {
      postData.link = product.image_url;
    }
  }

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
  const INSTAGRAM_ACCESS_TOKEN = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
  const INSTAGRAM_BUSINESS_ID = Deno.env.get('INSTAGRAM_BUSINESS_ID');
  
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) {
    throw new Error('Credenciais do Instagram não configuradas');
  }

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