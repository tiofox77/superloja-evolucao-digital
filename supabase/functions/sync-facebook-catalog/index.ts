import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetaSettings {
  access_token: string;
  catalog_id: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    // Buscar configurações do Meta
    const { data: metaSettings, error: metaError } = await supabaseClient
      .from('meta_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (metaError) {
      throw new Error(`Erro ao buscar configurações: ${metaError.message}`)
    }

    if (!metaSettings) {
      throw new Error('Configurações do Meta não encontradas ou inativas')
    }

    const settings = metaSettings as MetaSettings

    if (action === 'sync_all') {
      // Buscar produtos ativos
      const { data: products, error: productsError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('active', true)

      if (productsError) {
        throw new Error(`Erro ao buscar produtos: ${productsError.message}`)
      }

      const results = []

      for (const product of products as Product[]) {
        try {
          // Criar ou atualizar produto no Facebook Catalog
          const facebookProduct = {
            id: product.id,
            title: product.name,
            description: product.description || '',
            availability: 'in stock',
            condition: 'new',
            price: `${product.price} BRL`,
            link: `${Deno.env.get('SITE_URL') || 'https://superloja.com'}/produto/${product.id}`,
            image_link: product.image_url || '',
            brand: 'SuperLoja',
            custom_label_0: 'ecommerce'
          }

          // Fazer requisição para Facebook Graph API
          const response = await fetch(
            `https://graph.facebook.com/v18.0/${settings.catalog_id}/products`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(facebookProduct)
            }
          )

          const result = await response.json()

          if (response.ok) {
            // Atualizar status de sincronização
            await supabaseClient
              .from('facebook_products')
              .upsert({
                product_id: product.id,
                facebook_product_id: result.id,
                sync_status: 'synced',
                last_sync_at: new Date().toISOString(),
                sync_error: null
              })

            results.push({
              product_id: product.id,
              status: 'success',
              facebook_id: result.id
            })
          } else {
            // Registrar erro
            await supabaseClient
              .from('facebook_products')
              .upsert({
                product_id: product.id,
                sync_status: 'error',
                last_sync_at: new Date().toISOString(),
                sync_error: result.error?.message || 'Erro desconhecido'
              })

            results.push({
              product_id: product.id,
              status: 'error',
              error: result.error?.message || 'Erro desconhecido'
            })
          }
        } catch (error) {
          results.push({
            product_id: product.id,
            status: 'error',
            error: error.message
          })
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sincronização concluída',
          results 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})