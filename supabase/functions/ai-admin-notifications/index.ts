import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { 
      user_id, 
      conversation_id, 
      message, 
      reason, 
      context = {},
      platform = 'chat'
    } = await req.json();
    
    if (!user_id || !message || !reason) {
      return new Response(JSON.stringify({ 
        error: 'user_id, message e reason são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚨 Criando notificação admin:', { user_id, reason });

    // Criar notificação no banco
    const { data: notification, error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        user_id,
        conversation_id,
        message: message.substring(0, 500), // Limitar tamanho
        reason,
        platform,
        priority: 'medium',
        status: 'pending',
        context: {
          timestamp: new Date().toISOString(),
          user_context: context,
          escalation_reason: reason
        }
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError);
      throw notificationError;
    }

    // Marcar conversa como "aguardando admin"
    await supabase
      .from('ai_conversations')
      .update({ 
        metadata: { 
          ...context,
          awaiting_admin: true,
          escalated_at: new Date().toISOString(),
          escalation_reason: reason
        }
      })
      .eq('user_id', user_id)
      .eq('id', conversation_id);

    // Salvar no log de learning insights
    await supabase
      .from('ai_learning_insights')
      .insert({
        insight_type: 'admin_escalation',
        content: `Escalação: ${reason} | Usuário: ${user_id} | Mensagem: ${message.substring(0, 100)}...`,
        confidence_score: 1.0,
        usage_count: 1,
        effectiveness_score: 0.9,
        metadata: {
          user_id,
          conversation_id,
          escalation_reason: reason,
          platform,
          timestamp: new Date().toISOString()
        }
      });

    console.log('✅ Notificação admin criada:', notification.id);

    return new Response(JSON.stringify({
      success: true,
      notification_id: notification.id,
      message: 'Notificação enviada para o admin. Aguarde atendimento especializado.',
      escalated: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função ai-admin-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});