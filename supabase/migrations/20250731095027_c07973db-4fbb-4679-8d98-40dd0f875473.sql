-- Criar tabela para notificações admin
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id UUID,
  message TEXT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  platform VARCHAR(50) DEFAULT 'chat',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  assigned_to UUID,
  context JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin notifications are viewable by authenticated users" 
ON public.admin_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create admin notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin notifications can be updated by authenticated users" 
ON public.admin_notifications 
FOR UPDATE 
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at);