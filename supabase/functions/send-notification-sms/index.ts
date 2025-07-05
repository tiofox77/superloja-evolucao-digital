import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  type: 'welcome' | 'order_created' | 'status_changed';
  to: string;
  userName?: string;
  orderNumber?: string;
  orderTotal?: number;
  newStatus?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, userName, orderNumber, orderTotal, newStatus }: SmsRequest = await req.json();
    
    console.log('Sending SMS:', { type, to, userName, orderNumber });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create SMS message
    let message = '';

    switch (type) {
      case 'welcome':
        message = `Bem-vindo à SuperLoja, ${userName}! Sua conta foi criada com sucesso. Aproveite nossas ofertas!`;
        break;
      case 'order_created':
        message = `SuperLoja: Pedido #${orderNumber} confirmado! Total: ${orderTotal ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(orderTotal) : 'N/A'}`;
        break;
      case 'status_changed':
        message = `SuperLoja: Pedido #${orderNumber} - Status: ${newStatus}`;
        break;
    }

    // Create SMS log entry
    const logEntry = {
      user_id: null, // Will be updated if we find the user
      notification_type: 'sms',
      recipient: to,
      subject: null,
      message: message,
      status: 'pending',
      provider: 'twilio',
      metadata: {
        type,
        userName,
        orderNumber,
        orderTotal,
        newStatus
      }
    };

    // Try to get user ID from phone number (you might need to add phone to profiles)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', to)
      .single();

    if (profiles?.user_id) {
      logEntry.user_id = profiles.user_id;
    }

    try {
      // Insert initial log entry
      const { data: insertedLog, error: logError } = await supabase
        .from('notification_logs')
        .insert(logEntry)
        .select()
        .single();

      if (logError) throw logError;

      // Get Twilio settings from database
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'sms_settings')
        .single();

      let success = false;
      let errorMessage = null;
      let providerResponse = null;

      if (settings?.value) {
        const smsConfig = settings.value as any;
        
        if (smsConfig.sms_notifications_enabled && 
            smsConfig.twilio_account_sid && 
            smsConfig.twilio_auth_token && 
            smsConfig.twilio_phone_number) {
          
          try {
            // Send SMS via Twilio
            const twilioAuth = btoa(`${smsConfig.twilio_account_sid}:${smsConfig.twilio_auth_token}`);
            
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${smsConfig.twilio_account_sid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${twilioAuth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  From: 'SuperLoja',
                  To: to,
                  Body: message,
                }),
              }
            );

            const result = await response.json();
            
            if (response.ok) {
              success = true;
              providerResponse = result;
              console.log('SMS sent successfully:', result.sid);
            } else {
              errorMessage = result.message || 'Twilio API error';
              console.error('Twilio error:', result);
            }
            
          } catch (twilioError) {
            errorMessage = `Twilio request failed: ${twilioError.message}`;
            console.error('Twilio request error:', twilioError);
          }
          
        } else {
          errorMessage = 'SMS notifications not enabled or Twilio not configured';
        }
      } else {
        errorMessage = 'SMS settings not found';
      }

      // Update log with result
      const updateData: any = {
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        provider_response: providerResponse,
        error_message: errorMessage
      };

      await supabase
        .from('notification_logs')
        .update(updateData)
        .eq('id', insertedLog.id);

      console.log('SMS notification processed:', success ? 'success' : 'failed');

    } catch (logError) {
      console.error('Error logging SMS notification:', logError);
      // Continue execution even if logging fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'SMS notification processed' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-notification-sms:', error);
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