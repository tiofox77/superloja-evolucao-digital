import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('🔍 === TESTE DE DEBUG DA BASE DE CONHECIMENTO ===');
    console.log('📝 Query para teste:', query);

    // 1. Verificar se a configuração da base de conhecimento está ativa
    const { data: knowledgeConfig } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('key', 'knowledge_base_enabled');

    console.log('⚙️ Configuração da base de conhecimento:', knowledgeConfig);

    // 2. Verificar todos os conhecimentos ativos
    const { data: allKnowledge } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true);

    console.log('📚 Total de conhecimentos ativos:', allKnowledge?.length);
    
    // 3. Simular a busca que acontece no webhook
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íì]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úù]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s]/g, '');
    };
    
    const normalizedQuery = normalizeText(query);
    const keywords = normalizedQuery.split(' ').filter(word => word.length > 2);
    console.log('🔑 Palavras-chave normalizadas:', keywords);

    // 4. Buscar conhecimentos relevantes
    let foundKnowledge = null;
    if (allKnowledge) {
      const relevantKnowledge = allKnowledge.filter(item => {
        const itemText = normalizeText(`${item.question} ${item.answer} ${item.keywords.join(' ')}`);
        
        const hasMatch = keywords.some(keyword => {
          return itemText.includes(keyword) || 
                 keyword.includes('devoluc') && itemText.includes('devoluc') ||
                 keyword.includes('troca') && itemText.includes('troca') ||
                 keyword.includes('trocar') && itemText.includes('troca') ||
                 keyword.includes('devolver') && itemText.includes('devoluc') ||
                 keyword.includes('promocao') && itemText.includes('promocao') ||
                 keyword.includes('desconto') && itemText.includes('desconto');
        });
        
        if (hasMatch) {
          console.log(`✅ Match encontrado: ${item.question}`);
        }
        
        return hasMatch;
      });

      if (relevantKnowledge.length > 0) {
        foundKnowledge = relevantKnowledge.sort((a, b) => b.priority - a.priority)[0];
        console.log('🎯 Melhor conhecimento encontrado:', foundKnowledge.question);
      }
    }

    // 5. Simular como seria incluído no prompt
    let knowledgeInfo = '';
    if (foundKnowledge) {
      knowledgeInfo = `💡 INFORMAÇÃO RELEVANTE DA BASE DE CONHECIMENTO: 
📝 Pergunta: ${foundKnowledge.question}
📋 Resposta: ${foundKnowledge.answer}
🏷️ Categoria: ${foundKnowledge.category}`;
    }

    // 6. Verificar configurações do modelo IA
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .in('key', ['openai_api_key', 'preferred_model']);

    const result = {
      query,
      normalizedQuery,
      keywords,
      knowledgeBaseEnabled: knowledgeConfig?.[0]?.value === 'true',
      totalKnowledge: allKnowledge?.length || 0,
      foundKnowledge: foundKnowledge ? {
        question: foundKnowledge.question,
        answer: foundKnowledge.answer,
        category: foundKnowledge.category,
        keywords: foundKnowledge.keywords
      } : null,
      knowledgeInfo,
      aiSettings: aiSettings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {}) || {},
      allKnowledgeList: allKnowledge?.map(k => ({
        category: k.category,
        question: k.question,
        keywords: k.keywords,
        active: k.active
      })) || []
    };

    console.log('📊 Resultado final:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});