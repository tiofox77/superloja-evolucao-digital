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
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: props
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: error.message };
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
      const { error } = await supabase.functions.invoke('send-notification-sms', {
        body: props
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
    return await sendSmsNotification({
      type: 'welcome',
      to: phone,
      userName: 'Teste'
    });
  };

  const createOrderNotification = async (orderData: {
    userEmail: string;
    userName: string;
    orderNumber: string;
    orderTotal: number;
  }) => {
    // Get user ID from email
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
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
      orderTotal: orderData.orderTotal
    });
  };

  const createWelcomeNotification = async (userEmail: string, userName: string) => {
    // Get user ID from email
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
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
      userName
    });
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