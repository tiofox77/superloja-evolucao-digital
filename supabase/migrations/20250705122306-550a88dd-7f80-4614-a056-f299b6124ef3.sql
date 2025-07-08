-- Create notification logs table
CREATE TABLE public.notification_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms')),
    recipient text NOT NULL,
    subject text,
    message text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'queued')),
    provider text, -- 'smtp', 'twilio', etc
    provider_response jsonb,
    error_message text,
    metadata jsonb DEFAULT '{}',
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification logs
CREATE POLICY "Admins can view all notification logs" 
ON public.notification_logs FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage notification logs" 
ON public.notification_logs FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create trigger for timestamps
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);