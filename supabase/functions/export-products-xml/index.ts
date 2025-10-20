import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    console.log('🔄 Buscando produtos para exportação XML...');

    // Buscar todos os produtos ativos com suas categorias
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        original_price,
        stock_quantity,
        in_stock,
        active,
        image_url,
        images,
        product_type,
        is_digital,
        weight,
        dimensions,
        material,
        seo_title,
        seo_description,
        seo_keywords,
        created_at,
        updated_at,
        category_id,
        categories (
          id,
          name,
          slug,
          description
        )
      `)
      .eq('active', true)
      .order('name');

    if (error) {
      throw error;
    }

    console.log(`✅ ${products?.length || 0} produtos encontrados`);

    // Gerar XML
    const xml = generateProductsXML(products || []);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="produtos-export-${new Date().toISOString().split('T')[0]}.xml"`,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro ao exportar produtos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateProductsXML(products: any[]): string {
  const escapeXML = (str: string | null | undefined): string => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatPrice = (price: number | null): string => {
    return price ? price.toFixed(2) : '0.00';
  };

  const currentDate = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<produtos>\n';
  xml += `  <metadata>\n`;
  xml += `    <data_exportacao>${currentDate}</data_exportacao>\n`;
  xml += `    <total_produtos>${products.length}</total_produtos>\n`;
  xml += `    <origem>SuperLoja</origem>\n`;
  xml += `  </metadata>\n`;
  xml += '  <lista>\n';

  for (const product of products) {
    xml += '    <produto>\n';
    xml += `      <id>${escapeXML(product.id)}</id>\n`;
    xml += `      <nome>${escapeXML(product.name)}</nome>\n`;
    xml += `      <slug>${escapeXML(product.slug)}</slug>\n`;
    xml += `      <descricao>${escapeXML(product.description)}</descricao>\n`;
    
    // Categoria
    if (product.categories) {
      xml += `      <categoria>\n`;
      xml += `        <id>${escapeXML(product.categories.id)}</id>\n`;
      xml += `        <nome>${escapeXML(product.categories.name)}</nome>\n`;
      xml += `        <slug>${escapeXML(product.categories.slug)}</slug>\n`;
      xml += `      </categoria>\n`;
    } else {
      xml += `      <categoria>\n`;
      xml += `        <id></id>\n`;
      xml += `        <nome>Sem Categoria</nome>\n`;
      xml += `        <slug></slug>\n`;
      xml += `      </categoria>\n`;
    }
    
    // Preços
    xml += `      <preco>\n`;
    xml += `        <valor>${formatPrice(product.price)}</valor>\n`;
    xml += `        <moeda>BRL</moeda>\n`;
    if (product.original_price) {
      xml += `        <preco_original>${formatPrice(product.original_price)}</preco_original>\n`;
      const desconto = ((product.original_price - product.price) / product.original_price * 100).toFixed(0);
      xml += `        <desconto_percentual>${desconto}</desconto_percentual>\n`;
    }
    xml += `      </preco>\n`;
    
    // Estoque
    xml += `      <estoque>\n`;
    xml += `        <quantidade>${product.stock_quantity || 0}</quantidade>\n`;
    xml += `        <disponivel>${product.in_stock ? 'true' : 'false'}</disponivel>\n`;
    xml += `      </estoque>\n`;
    
    // Tipo e características
    xml += `      <tipo_produto>${escapeXML(product.product_type || 'physical')}</tipo_produto>\n`;
    xml += `      <digital>${product.is_digital ? 'true' : 'false'}</digital>\n`;
    
    if (product.weight) {
      xml += `      <peso>${product.weight}</peso>\n`;
    }
    
    if (product.dimensions) {
      xml += `      <dimensoes>${escapeXML(product.dimensions)}</dimensoes>\n`;
    }
    
    if (product.material) {
      xml += `      <material>${escapeXML(product.material)}</material>\n`;
    }
    
    // Imagens
    xml += `      <imagens>\n`;
    if (product.image_url) {
      xml += `        <principal>${escapeXML(product.image_url)}</principal>\n`;
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      xml += `        <galeria>\n`;
      product.images.forEach((img: string) => {
        xml += `          <imagem>${escapeXML(img)}</imagem>\n`;
      });
      xml += `        </galeria>\n`;
    }
    xml += `      </imagens>\n`;
    
    // SEO
    if (product.seo_title || product.seo_description || product.seo_keywords) {
      xml += `      <seo>\n`;
      if (product.seo_title) {
        xml += `        <titulo>${escapeXML(product.seo_title)}</titulo>\n`;
      }
      if (product.seo_description) {
        xml += `        <descricao>${escapeXML(product.seo_description)}</descricao>\n`;
      }
      if (product.seo_keywords) {
        xml += `        <palavras_chave>${escapeXML(product.seo_keywords)}</palavras_chave>\n`;
      }
      xml += `      </seo>\n`;
    }
    
    // Datas
    xml += `      <datas>\n`;
    xml += `        <criado_em>${escapeXML(product.created_at)}</criado_em>\n`;
    xml += `        <atualizado_em>${escapeXML(product.updated_at)}</atualizado_em>\n`;
    xml += `      </datas>\n`;
    
    xml += `      <ativo>${product.active ? 'true' : 'false'}</ativo>\n`;
    xml += '    </produto>\n';
  }

  xml += '  </lista>\n';
  xml += '</produtos>';

  return xml;
}
