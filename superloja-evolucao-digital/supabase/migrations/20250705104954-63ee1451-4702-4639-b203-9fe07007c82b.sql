-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  order_status TEXT DEFAULT 'completed' CHECK (order_status IN ('pending', 'processing', 'completed', 'cancelled')),
  order_source TEXT DEFAULT 'pos' CHECK (order_source IN ('pos', 'website')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar pedidos" 
ON public.orders 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pedidos são visíveis para admins" 
ON public.orders 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS para order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar itens do pedido" 
ON public.order_items 
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Itens do pedido são visíveis para admins" 
ON public.order_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at em orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();