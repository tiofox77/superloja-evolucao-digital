-- Criar tabela específica para escalações de admin
CREATE TABLE public.admin_escalations (
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
ALTER TABLE public.admin_escalations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin escalations are viewable by authenticated users" 
ON public.admin_escalations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create admin escalations" 
ON public.admin_escalations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin escalations can be updated by authenticated users" 
ON public.admin_escalations 
FOR UPDATE 
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_admin_escalations_updated_at
BEFORE UPDATE ON public.admin_escalations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_admin_escalations_status ON public.admin_escalations(status);
CREATE INDEX idx_admin_escalations_user_id ON public.admin_escalations(user_id);
CREATE INDEX idx_admin_escalations_created_at ON public.admin_escalations(created_at);