import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'welcome' | 'order_created' | 'status_changed';
  to: string;
  userName?: string;
  orderNumber?: string;
  orderTotal?: number;
  newStatus?: string;
  orderDetails?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, userName, orderNumber, orderTotal, newStatus, orderDetails }: EmailRequest = await req.json();
    
    console.log('Sending email:', { type, to, userName, orderNumber });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get notification templates
    const { data: templateSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'notification_templates')
      .single();

    // Create notification message using template
    let title = '';
    let message = '';

    if (templateSettings?.value?.email_templates?.[type]) {
      const template = templateSettings.value.email_templates[type];
      title = template.subject || '';
      message = template.body || '';
    } else {
      // Fallback to default messages
      switch (type) {
        case 'welcome':
          title = 'Bem-vindo à SuperLoja!';
          message = `Olá ${userName}! Sua conta foi criada com sucesso. Aproveite nossas ofertas especiais!`;
          break;
        case 'order_created':
          title = 'Pedido Confirmado';
          message = `Seu pedido #${orderNumber} foi criado com sucesso! Total: ${orderTotal ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(orderTotal) : 'N/A'}`;
          break;
        case 'status_changed':
          title = 'Status do Pedido Atualizado';
          message = `Seu pedido #${orderNumber} teve o status alterado para: ${newStatus}`;
          break;
      }
    }

    // Replace template variables
    if (userName) {
      title = title.replace(/{userName}/g, userName);
      message = message.replace(/{userName}/g, userName);
    }
    if (orderNumber) {
      title = title.replace(/{orderNumber}/g, orderNumber);
      message = message.replace(/{orderNumber}/g, orderNumber);
    }
    if (orderTotal) {
      const formattedTotal = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(orderTotal);
      title = title.replace(/{orderTotal}/g, formattedTotal);
      message = message.replace(/{orderTotal}/g, formattedTotal);
    }
    if (newStatus) {
      title = title.replace(/{newStatus}/g, newStatus);
      message = message.replace(/{newStatus}/g, newStatus);
    }

    // Create notification log entry
    const logEntry = {
      user_id: null, // Will be updated if we find the user
      notification_type: 'email',
      recipient: to,
      subject: title,
      message: message,
      status: 'pending',
      provider: 'smtp',
      metadata: {
        type,
        userName,
        orderNumber,
        orderTotal,
        newStatus
      }
    };

    // Try to get user ID from email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', to)
      .single();

    if (profiles?.user_id) {
      logEntry.user_id = profiles.user_id;
      
      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: profiles.user_id,
          title,
          message,
          type: type === 'welcome' ? 'success' : 'info'
        });
    }

    try {
      // Insert initial log entry
      const { data: insertedLog, error: logError } = await supabase
        .from('notification_logs')
        .insert(logEntry)
        .select()
        .single();

      if (logError) throw logError;

      // TODO: Here you would integrate with SMTP or email service
      // For now, we'll simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate simulation

      // Update log with result
      const updateData: any = {
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        provider_response: success 
          ? { message_id: `msg_${Date.now()}`, status: 'delivered' }
          : null,
        error_message: success ? null : 'Simulated error: SMTP configuration not available'
      };

      await supabase
        .from('notification_logs')
        .update(updateData)
        .eq('id', insertedLog.id);

      console.log('Email notification processed:', success ? 'success' : 'failed');

    } catch (logError) {
      console.error('Error logging notification:', logError);
      // Continue execution even if logging fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification processed' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-notification-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);