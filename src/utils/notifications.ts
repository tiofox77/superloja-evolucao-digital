import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos de notificação disponíveis
export type NotificationType = 
  | 'system_error'
  | 'ai_config_changed'
  | 'new_order_pending'
  | 'ai_learning_feedback'
  | 'system_health_report';

export type NotificationPriority = 'low' | 'normal' | 'medium' | 'high';

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  showToast?: boolean;
}

// Função principal para enviar notificações
export async function sendAdminNotification({
  type,
  title,
  message,
  priority = 'normal',
  data = {},
  showToast = true
}: NotificationData): Promise<boolean> {
  try {
    console.log('📧 Enviando notificação admin:', { type, title, priority });

    // Chamar a edge function de notificação
    const { data: result, error } = await supabase.functions.invoke('send-admin-notification', {
      body: {
        type,
        title,
        message,
        priority,
        data
      }
    });

    if (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      if (showToast) {
        toast.error('Erro ao enviar notificação');
      }
      return false;
    }

    console.log('✅ Notificação enviada:', result);
    
    if (showToast) {
      const toastMessage = priority === 'high' 
        ? 'Notificação crítica enviada!'
        : 'Notificação enviada com sucesso!';
      
      toast.success(toastMessage);
    }

    return true;

  } catch (error) {
    console.error('❌ Erro inesperado na notificação:', error);
    if (showToast) {
      toast.error('Erro inesperado ao enviar notificação');
    }
    return false;
  }
}

// Funções específicas para cada tipo de notificação

export async function notifyConfigurationChanged(
  configName: string, 
  details: string, 
  oldValue?: any, 
  newValue?: any
) {
  return await sendAdminNotification({
    type: 'ai_config_changed',
    title: `Configuração alterada: ${configName}`,
    message: details,
    priority: 'normal',
    data: {
      config_name: configName,
      old_value: oldValue,
      new_value: newValue,
      timestamp: new Date().toISOString()
    }
  });
}

export async function notifySystemError(
  errorTitle: string, 
  errorMessage: string, 
  errorData?: any
) {
  return await sendAdminNotification({
    type: 'system_error',
    title: errorTitle,
    message: errorMessage,
    priority: 'high',
    data: {
      error_data: errorData,
      stack_trace: errorData?.stack || null,
      timestamp: new Date().toISOString()
    }
  });
}

export async function notifyNewOrderPending(
  customerName: string, 
  orderDetails: string, 
  orderData?: any
) {
  return await sendAdminNotification({
    type: 'new_order_pending',
    title: `Novo pedido de ${customerName}`,
    message: orderDetails,
    priority: 'medium',
    data: {
      customer_name: customerName,
      order_id: orderData?.id,
      total: orderData?.total,
      timestamp: new Date().toISOString()
    }
  });
}

export async function notifyAILearningFeedback(
  insightTitle: string, 
  insightDetails: string, 
  learningData?: any
) {
  return await sendAdminNotification({
    type: 'ai_learning_feedback',
    title: insightTitle,
    message: insightDetails,
    priority: 'low',
    data: {
      confidence_score: learningData?.confidence_score,
      user_feedback: learningData?.feedback,
      improvement_suggestion: learningData?.suggestion,
      timestamp: new Date().toISOString()
    }
  });
}

export async function notifySystemHealthReport(
  healthStatus: string, 
  healthDetails: string, 
  healthData?: any
) {
  return await sendAdminNotification({
    type: 'system_health_report',
    title: `Status do sistema: ${healthStatus}`,
    message: healthDetails,
    priority: healthStatus.includes('ERRO') ? 'high' : 'normal',
    data: {
      health_checks: healthData?.checks,
      system_metrics: healthData?.metrics,
      timestamp: new Date().toISOString()
    }
  });
}

// Função para verificar e notificar problemas comuns
export async function performSystemHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  report: string;
}> {
  const issues: string[] = [];
  const checks: any[] = [];

  try {
    // Verificar OpenAI
    const { data: openaiSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'openai_api_key');

    const hasOpenAI = openaiSettings && openaiSettings.length > 0 && openaiSettings[0].value;
    checks.push({
      component: 'OpenAI API',
      status: hasOpenAI ? 'OK' : 'ERROR',
      message: hasOpenAI ? 'Chave configurada' : 'Chave não encontrada'
    });

    if (!hasOpenAI) {
      issues.push('OpenAI API não configurada');
    }

    // Verificar Facebook Token
    const { data: facebookSettings } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'facebook_page_access_token');

    const hasFacebook = facebookSettings && facebookSettings.length > 0 && facebookSettings[0].value;
    checks.push({
      component: 'Facebook Messenger',
      status: hasFacebook ? 'OK' : 'WARNING',
      message: hasFacebook ? 'Token configurado' : 'Token não encontrado'
    });

    if (!hasFacebook) {
      issues.push('Token do Facebook não configurado');
    }

    // Verificar produtos ativos
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    checks.push({
      component: 'Catálogo de Produtos',
      status: (activeProducts || 0) > 0 ? 'OK' : 'WARNING',
      message: `${activeProducts || 0} produtos ativos`
    });

    if ((activeProducts || 0) === 0) {
      issues.push('Nenhum produto ativo no catálogo');
    }

    // Verificar base de conhecimento
    const { count: knowledgeItems } = await supabase
      .from('ai_knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    checks.push({
      component: 'Base de Conhecimento',
      status: (knowledgeItems || 0) > 0 ? 'OK' : 'INFO',
      message: `${knowledgeItems || 0} itens ativos`
    });

    const healthy = issues.length === 0;
    const report = checks.map(check => 
      `${check.component}: ${check.status} - ${check.message}`
    ).join('\n');

    // Enviar notificação se houver problemas críticos
    if (issues.length > 0) {
      await notifySystemHealthReport(
        issues.length > 0 ? 'PROBLEMAS DETECTADOS' : 'SISTEMA SAUDÁVEL',
        `Verificação automática encontrou ${issues.length} problema(s):\n${issues.join('\n')}`,
        { checks, issues }
      );
    }

    return {
      healthy,
      issues,
      report
    };

  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error);
    await notifySystemError('Erro na verificação de saúde', error.message, error);
    
    return {
      healthy: false,
      issues: ['Erro ao executar verificação de saúde'],
      report: 'Falha na verificação automática'
    };
  }
}