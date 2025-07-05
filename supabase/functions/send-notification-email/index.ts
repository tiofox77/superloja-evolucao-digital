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

    // Note: For now, we'll use a simple email service
    // In production, you would integrate with Resend or another email service
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a notification in the database
    let title = '';
    let message = '';

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

    // Get user ID from email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', to)
      .single();

    if (profiles?.user_id) {
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

    // TODO: Integrate with Resend for actual email sending
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    // await resend.emails.send({
    //   from: 'SuperLoja <noreply@superloja.com>',
    //   to: [to],
    //   subject: title,
    //   html: generateEmailTemplate(type, { userName, orderNumber, orderTotal, newStatus })
    // });

    console.log('Email notification processed successfully');

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