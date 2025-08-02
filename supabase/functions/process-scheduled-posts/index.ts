import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('⏰ Executando processo de posts agendados...');

  try {
    // Buscar posts agendados que devem ser publicados agora
    const now = new Date().toISOString();
    
    const { data: postsToPublish, error } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        products(name, image_url)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (error) {
      console.error('❌ Erro ao buscar posts agendados:', error);
      throw error;
    }

    console.log(`📋 Encontrados ${postsToPublish?.length || 0} posts para publicar`);

    const results = [];

    for (const post of postsToPublish || []) {
      console.log(`📤 Processando post ${post.id} para ${post.platform}`);

      try {
        // Processar o post
        const publishResults = [];

        if (post.platform === 'facebook' || post.platform === 'both') {
          try {
            const facebookResult = await postToFacebook(post.content, post.product_id, supabase);
            publishResults.push({ platform: 'facebook', ...facebookResult });
            console.log('✅ Post publicado no Facebook');
          } catch (error) {
            publishResults.push({ platform: 'facebook', success: false, error: error.message });
            console.error('❌ Erro no Facebook:', error.message);
          }
        }

        if (post.platform === 'instagram' || post.platform === 'both') {
          try {
            const instagramResult = await postToInstagram(post.content, post.product_id, supabase);
            publishResults.push({ platform: 'instagram', ...instagramResult });
            console.log('✅ Post publicado no Instagram');
          } catch (error) {
            publishResults.push({ platform: 'instagram', success: false, error: error.message });
            console.error('❌ Erro no Instagram:', error.message);
          }
        }

        // Verificar se pelo menos uma publicação foi bem-sucedida
        const successCount = publishResults.filter(r => r.success).length;
        const newStatus = successCount > 0 ? 'posted' : 'failed';
        const errorMessage = successCount === 0 ? 
          publishResults.map(r => `${r.platform}: ${r.error}`).join('; ') : 
          null;

        // Atualizar status do post agendado
        await supabase
          .from('scheduled_posts')
          .update({
            status: newStatus,
            posted_at: new Date().toISOString(),
            error_message: errorMessage
          })
          .eq('id', post.id);

        // Salvar no histórico
        await supabase
          .from('social_posts_history')
          .insert({
            platform: post.platform,
            content: post.content,
            product_id: post.product_id,
            post_type: post.post_type,
            results: publishResults,
            posted_at: new Date().toISOString()
          });

        results.push({
          post_id: post.id,
          status: newStatus,
          results: publishResults
        });

      } catch (error) {
        console.error(`❌ Erro ao processar post ${post.id}:`, error);
        
        // Marcar como falha
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', post.id);

        results.push({
          post_id: post.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log(`✅ Processo concluído. ${results.length} posts processados`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: results.length,
        results: results
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Erro no processamento automático:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

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