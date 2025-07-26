import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationProps {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface SendEmailNotificationProps {
  type: 'welcome' | 'order_created' | 'status_changed';
  to: string;
  userName?: string;
  orderNumber?: string;
  orderTotal?: number;
  newStatus?: string;
  orderDetails?: any;
  force_real?: boolean;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  orderPhone?: string;
  orderAddress?: string;
}

export const useNotifications = () => {
  const createNotification = async ({ userId, title, message, type = 'info' }: CreateNotificationProps) => {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('No user found');
        targetUserId = user.user.id;
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type
        });

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error);
      return { success: false, error: error.message };
    }
  };

  const sendEmailNotification = async (props: SendEmailNotificationProps) => {
    const { to, type, userName } = props;
    
    // Verificar se temos um endereço de email válido
    if (!to) {
      console.warn('Endereço de email não fornecido');
      return { success: false, error: 'Endereço de email obrigatório' };
    }

    // Verificar se o endereço de email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.warn('Endereço de email inválido:', to);
      return { success: false, error: 'Endereço de email inválido' };
    }

    try {
      // USAR EXATAMENTE A MESMA LÓGICA QUE FUNCIONA NO TESTE DE EMAIL DAS CONFIGURAÇÕES
      
      // Usar URL relativa baseada no ambiente (igual ao teste de email)
      const baseUrl = window.location.hostname === 'localhost' ? 
        'http://localhost/superlojareact/public/api' :
        '/api';
        
      console.log(`Enviando email tipo=${type} para=${to} usando endpoint: ${baseUrl}/send-email.php`);
        
      const response = await fetch(`${baseUrl}/send-email.php`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: type,
          to: to,
          userName: userName,
          // Incluir campos adicionais se fornecidos
          ...(props.orderNumber && { orderNumber: props.orderNumber }),
          ...(props.orderTotal && { orderTotal: props.orderTotal }),
          ...(props.newStatus && { newStatus: props.newStatus }),
          ...(props.items && { items: props.items }),
          ...(props.orderPhone && { orderPhone: props.orderPhone }),
          ...(props.orderAddress && { orderAddress: props.orderAddress }),
          force_real: props.force_real || true  // Usar o valor fornecido ou forçar real
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Email ${type} enviado com sucesso para ${to}`);
        return { success: true };
      } else {
        console.error('Erro no envio do email:', result.error || result.message);
        return { success: false, error: result.error || result.message };
      }
      
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      
      // Fallback para o Supabase Functions apenas se o endpoint PHP falhar completamente
      try {
        console.log('Tentando fallback Supabase Functions para email');
        const { error: supabaseError } = await supabase.functions.invoke('send-notification-email', {
          body: props
        });

        if (supabaseError) throw supabaseError;
        
        return { success: true };
      } catch (fallbackError: any) {
        console.error('Erro também no fallback Supabase:', fallbackError);
        return { success: false, error: fallbackError.message };
      }
    }
  };

  const sendSmsNotification = async (props: {
    type: 'welcome' | 'order_created' | 'status_changed';
    to: string;
    userName?: string;
    orderNumber?: string;
    orderTotal?: number;
    newStatus?: string;
  }) => {
    try {
      // Garantir que o número tenha o prefixo +244
      let formattedPhone = props.to;
      if (!formattedPhone.startsWith('+')) {
        // Remove qualquer prefixo existente e adiciona +244
        formattedPhone = formattedPhone.replace(/^244/, '').replace(/^\+/, '');
        formattedPhone = `+244${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+244')) {
        // Se tem + mas não é +244, corrigir
        formattedPhone = formattedPhone.replace(/^\+/, '');
        formattedPhone = formattedPhone.replace(/^244/, '');
        formattedPhone = `+244${formattedPhone}`;
      }

      console.log('Sending SMS to formatted number:', formattedPhone);
      // Get template configuration
      const { data: templateSettings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'notification_templates')
        .single();

      let shouldSend = true;
      if (templateSettings?.value) {
        const templates = templateSettings.value as any;
        if (templates?.sms_templates?.[props.type]) {
          shouldSend = templates.sms_templates[props.type].enabled;
        }
      }

      if (!shouldSend) {
        console.log(`SMS template for ${props.type} is disabled`);
        return { success: true, skipped: true };
      }

      const { error } = await supabase.functions.invoke('send-notification-sms', {
        body: {
          ...props,
          to: formattedPhone
        }
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar SMS:', error);
      return { success: false, error: error.message };
    }
  };

  const sendTestEmail = async (email: string) => {
    return await sendEmailNotification({
      type: 'welcome',
      to: email,
      userName: 'Teste'
    });
  };

  const sendTestSms = async (phone: string) => {
    // Garantir que o número tenha o prefixo +244
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.replace(/^244/, '').replace(/^\+/, '');
      formattedPhone = `+244${formattedPhone}`;
    } else if (!formattedPhone.startsWith('+244')) {
      formattedPhone = formattedPhone.replace(/^\+/, '');
      formattedPhone = formattedPhone.replace(/^244/, '');
      formattedPhone = `+244${formattedPhone}`;
    }

    return await sendSmsNotification({
      type: 'welcome',
      to: formattedPhone,
      userName: 'Teste'
    });
  };

  const createOrderNotification = async (orderData: {
    userEmail: string;
    userName: string;
    orderNumber: string;
    orderTotal: number;
    userPhone?: string;
    force_real?: boolean;
    items?: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }>;
    orderPhone?: string;
    orderAddress?: string;
  }) => {
    // Get user ID from email
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, phone')
      .eq('email', orderData.userEmail)
      .single();

    if (profile?.user_id) {
      // Create notification
      await createNotification({
        userId: profile.user_id,
        title: 'Pedido Confirmado',
        message: `Seu pedido #${orderData.orderNumber} foi criado com sucesso! Total: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(orderData.orderTotal)}`,
        type: 'success'
      });
    }

    // Send email notification
    await sendEmailNotification({
      type: 'order_created',
      to: orderData.userEmail,
      userName: orderData.userName,
      orderNumber: orderData.orderNumber,
      orderTotal: orderData.orderTotal,
      force_real: orderData.force_real, // Passa o parâmetro force_real se fornecido
      items: orderData.items, // Dados dos itens para gerar PDF
      orderPhone: orderData.orderPhone, // Telefone do cliente
      orderAddress: orderData.orderAddress // Endereço do cliente
    });

    // Send SMS notification if phone available
    const phoneToUse = orderData.userPhone || profile?.phone;
    if (phoneToUse) {
      try {
        await sendSmsNotification({
          type: 'order_created',
          to: phoneToUse,
          userName: orderData.userName,
          orderNumber: orderData.orderNumber,
          orderTotal: orderData.orderTotal
        });
      } catch (smsError) {
        console.error('Erro ao enviar SMS do pedido:', smsError);
      }
    }
  };

  const createWelcomeNotification = async (userEmail: string, userName: string, userPhone?: string, force_real?: boolean) => {
    // Get user ID from email
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, phone')
      .eq('email', userEmail)
      .single();

    if (profile?.user_id) {
      // Create notification
      await createNotification({
        userId: profile.user_id,
        title: 'Bem-vindo à SuperLoja!',
        message: `Olá ${userName}! Sua conta foi criada com sucesso. Aproveite nossas ofertas especiais!`,
        type: 'success'
      });
    }

    // Send email notification
    await sendEmailNotification({
      type: 'welcome',
      to: userEmail,
      userName,
      force_real // Passa o parâmetro force_real se fornecido
    });

    // Send SMS notification if phone available
    const phoneToUse = userPhone || profile?.phone;
    if (phoneToUse) {
      try {
        await sendSmsNotification({
          type: 'welcome',
          to: phoneToUse,
          userName
        });
      } catch (smsError) {
        console.error('Erro ao enviar SMS de boas-vindas:', smsError);
      }
    }
  };

  return {
    createNotification,
    sendEmailNotification,
    sendSmsNotification,
    createOrderNotification,
    createWelcomeNotification,
    sendTestEmail,
    sendTestSms
  };
};