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

    console.log('🔍 === TESTE DE DEBUG DA BASE DE CONHECIMENTO (v2.0) ===');
    console.log('📝 Query para teste:', query);
    console.log('🚀 Iniciando debug com algoritmo corrigido...');

    // 1. Verificar se a configuração da base de conhecimento está ativa
    const { data: knowledgeConfig, error: configError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('key', 'knowledge_base_enabled');

    console.log('⚙️ Configuração da base de conhecimento:', knowledgeConfig);
    console.log('⚙️ Erro na config (se houver):', configError);
    console.log('⚙️ Valor extraído:', knowledgeConfig?.[0]?.value);
    console.log('⚙️ Comparação:', knowledgeConfig?.[0]?.value === 'true');

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

    // 4. Buscar conhecimentos relevantes usando algoritmo corrigido
    let foundKnowledge = null;
    if (allKnowledge) {
      console.log('🔍 Aplicando algoritmo de busca corrigido...');
      
      // Primeiro, buscar correspondência EXATA na pergunta
      const exactMatch = allKnowledge.find(item => {
        const normalizedQuestion = normalizeText(item.question);
        const match = normalizedQuestion === normalizedQuery;
        if (match) {
          console.log('🎯 CORRESPONDÊNCIA EXATA encontrada:', item.question);
        }
        return match;
      });
      
      if (exactMatch) {
        foundKnowledge = exactMatch;
        console.log('✅ Usando correspondência exata:', exactMatch.question);
      } else {
        // Se não encontrou correspondência exata, buscar por palavras-chave
        const relevantKnowledge = allKnowledge.filter(item => {
          const itemText = normalizeText(`${item.question} ${item.answer} ${item.keywords.join(' ')}`);
          
          // Calcular score de relevância
          let score = 0;
          
          const hasMatch = keywords.some(keyword => {
            if (itemText.includes(keyword)) {
              score += 1;
              return true;
            }
            
            // Verificações especiais para palavras relacionadas
            if (keyword.includes('devoluc') && itemText.includes('devoluc')) {
              score += 1;
              return true;
            }
            if (keyword.includes('troca') && itemText.includes('troca')) {
              score += 1;
              return true;
            }
            if (keyword.includes('entrega') && itemText.includes('entrega')) {
              score += 2; // Prioridade extra para entrega
              return true;
            }
            if (keyword.includes('pagamento') && itemText.includes('pagamento')) {
              score += 2; // Prioridade extra para pagamento
              return true;
            }
            
            return false;
          });
          
          if (hasMatch) {
            console.log(`✅ Match encontrado: ${item.question} (score: ${score})`);
            item.relevanceScore = score;
          }
          
          return hasMatch;
        });

        if (relevantKnowledge.length > 0) {
          // Ordenar por score de relevância primeiro, depois por prioridade
          foundKnowledge = relevantKnowledge.sort((a, b) => {
            if (a.relevanceScore !== b.relevanceScore) {
              return b.relevanceScore - a.relevanceScore;
            }
            return b.priority - a.priority;
          })[0];
          
          console.log('✅ Melhor conhecimento encontrado:', foundKnowledge.question, 'Score:', foundKnowledge.relevanceScore);
        }
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