import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { type, title, message, priority = 'normal', data = {} } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📧 === SISTEMA NOTIFICAÇÃO ADMIN ===');
    console.log('🔔 Tipo:', type);
    console.log('📝 Título:', title);
    console.log('⚡ Prioridade:', priority);

    // Tipos de notificação disponíveis
    const notificationTypes = {
      'system_error': {
        subject: '🚨 Erro no Sistema - SuperLoja',
        template: 'system_error'
      },
      'ai_config_changed': {
        subject: '⚙️ Configuração IA Alterada - SuperLoja',
        template: 'config_change'
      },
      'new_order_pending': {
        subject: '🛒 Novo Pedido Pendente - SuperLoja',
        template: 'order_pending'
      },
      'ai_learning_feedback': {
        subject: '🧠 Feedback de Aprendizado IA - SuperLoja',
        template: 'learning_feedback'
      },
      'system_health_report': {
        subject: '📊 Relatório de Saúde do Sistema - SuperLoja',
        template: 'health_report'
      }
    };

    const config = notificationTypes[type as keyof typeof notificationTypes];
    if (!config) {
      throw new Error(`Tipo de notificação inválido: ${type}`);
    }

    // Salvar notificação no banco
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: priority === 'high' ? 'error' : 'info',
        user_id: null // Notificação do sistema
      });

    if (notificationError) {
      console.error('❌ Erro ao salvar notificação:', notificationError);
    }

    // Log da notificação
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        notification_type: type,
        recipient: 'admin@superloja.vip',
        subject: config.subject,
        message: formatMessage(config.template, { title, message, data }),
        status: 'sent',
        provider: 'internal',
        sent_at: new Date().toISOString(),
        metadata: {
          priority,
          template: config.template,
          ...data
        }
      });

    if (logError) {
      console.error('❌ Erro ao salvar log:', logError);
    }

    // Determinar ação baseada na prioridade
    let action = 'logged';
    if (priority === 'high') {
      action = 'email_sent'; // Aqui você pode integrar com SendGrid, etc.
      console.log('🚨 ALTA PRIORIDADE - Email seria enviado');
    } else if (priority === 'medium') {
      action = 'dashboard_alert';
      console.log('⚠️ MÉDIA PRIORIDADE - Alerta no dashboard');
    }

    // Notificações específicas para cada tipo
    await handleSpecificNotification(type, { title, message, data }, supabase);

    console.log('✅ Notificação processada com sucesso');

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      message: 'Notificação enviada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na notificação:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para formatar mensagens baseada no template
function formatMessage(template: string, data: any): string {
  const templates = {
    'system_error': `
🚨 ERRO NO SISTEMA DETECTADO

📝 Título: ${data.title}
💬 Mensagem: ${data.message}
🕐 Hora: ${new Date().toLocaleString('pt-AO')}

${data.data ? `📊 Dados Adicionais: ${JSON.stringify(data.data)}` : ''}

⚡ Ação Necessária: Verificar logs do sistema e corrigir problema.
`,
    
    'config_change': `
⚙️ CONFIGURAÇÃO ALTERADA

📝 Alteração: ${data.title}
💬 Detalhes: ${data.message}
🕐 Hora: ${new Date().toLocaleString('pt-AO')}

${data.data ? `📋 Configurações: ${JSON.stringify(data.data)}` : ''}

✅ Status: Configuração salva com sucesso.
`,
    
    'order_pending': `
🛒 NOVO PEDIDO PENDENTE

📝 Cliente: ${data.title}
💬 Detalhes: ${data.message}
🕐 Hora: ${new Date().toLocaleString('pt-AO')}

${data.data ? `💰 Valor: ${data.data.total || 'N/A'} Kz` : ''}

⚡ Ação Necessária: Processar pedido no painel administrativo.
`,
    
    'learning_feedback': `
🧠 FEEDBACK DE APRENDIZADO IA

📝 Insight: ${data.title}
💬 Detalhes: ${data.message}
🕐 Hora: ${new Date().toLocaleString('pt-AO')}

${data.data ? `📈 Métricas: ${JSON.stringify(data.data)}` : ''}

💡 A IA identificou padrões que podem melhorar o atendimento.
`,
    
    'health_report': `
📊 RELATÓRIO DE SAÚDE DO SISTEMA

📝 Status: ${data.title}
💬 Resultados: ${data.message}
🕐 Hora: ${new Date().toLocaleString('pt-AO')}

${data.data ? `🔍 Detalhes: ${JSON.stringify(data.data)}` : ''}

✅ Sistema monitorado automaticamente.
`
  };

  return templates[template as keyof typeof templates] || data.message;
}

// Função para lidar com notificações específicas
async function handleSpecificNotification(type: string, data: any, supabase: any) {
  switch (type) {
    case 'ai_config_changed':
      // Atualizar métricas de configuração
      await supabase
        .from('ai_metrics')
        .upsert({
          date: new Date().toISOString().split('T')[0],
          total_messages: 0,
          platform_breakdown: { config_changes: 1 }
        });
      break;
      
    case 'new_order_pending':
      // Marcar como notificado
      if (data.data?.order_id) {
        await supabase
          .from('orders')
          .update({ 
            notes: (data.data.notes || '') + '\nAdmin notificado automaticamente.' 
          })
          .eq('id', data.data.order_id);
      }
      break;
      
    case 'system_error':
      // Log erro para análise
      await supabase
        .from('ai_learning_insights')
        .insert({
          insight_type: 'system_error',
          content: `Erro detectado: ${data.title} - ${data.message}`,
          confidence_score: 1.0,
          effectiveness_score: 0.0,
          metadata: data.data || {}
        });
      break;
  }
}