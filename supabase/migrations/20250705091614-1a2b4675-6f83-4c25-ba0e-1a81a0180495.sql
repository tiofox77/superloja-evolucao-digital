-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id),
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de carrinho
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (públicas para leitura)
CREATE POLICY "Categorias são visíveis para todos" 
ON public.categories 
FOR SELECT 
USING (true);

-- Políticas para produtos (públicos para leitura)
CREATE POLICY "Produtos são visíveis para todos" 
ON public.products 
FOR SELECT 
USING (true);

-- Políticas para carrinho (baseado em session_id)
CREATE POLICY "Usuários podem ver seus próprios itens do carrinho" 
ON public.cart_items 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar itens no carrinho" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seus próprios itens do carrinho" 
ON public.cart_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários podem deletar seus próprios itens do carrinho" 
ON public.cart_items 
FOR DELETE 
USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.categories (name, slug, description) VALUES
('Smartphones', 'smartphones', 'Os melhores smartphones e celulares'),
('Computadores', 'computadores', 'Notebooks, desktops e acessórios'),
('Áudio', 'audio', 'Fones de ouvido, caixas de som e equipamentos de áudio'),
('Gaming', 'gaming', 'Consoles, jogos e acessórios para gamers'),
('Casa Inteligente', 'casa-inteligente', 'Dispositivos IoT e automação residencial');

-- Inserir produtos de exemplo
INSERT INTO public.products (name, slug, description, price, original_price, image_url, category_id, featured, stock_quantity) VALUES
('iPhone 15 Pro Max', 'iphone-15-pro-max', 'O mais avançado iPhone com chip A17 Pro', 8999.99, 9999.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'smartphones'), true, 50),
('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Smartphone premium com S Pen e câmera de 200MP', 7499.99, 8299.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'smartphones'), true, 30),
('MacBook Pro M3', 'macbook-pro-m3', 'Notebook profissional com chip M3 da Apple', 12999.99, 13999.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'computadores'), true, 20),
('Dell XPS 13', 'dell-xps-13', 'Ultrabook premium com tela InfinityEdge', 5999.99, 6999.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'computadores'), false, 25),
('AirPods Pro 2', 'airpods-pro-2', 'Fones sem fio com cancelamento de ruído ativo', 1899.99, 2199.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'audio'), true, 100),
('PlayStation 5', 'playstation-5', 'Console de nova geração da Sony', 3999.99, 4499.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'gaming'), true, 15),
('Echo Dot 5ª Geração', 'echo-dot-5', 'Smart speaker compacto com Alexa', 299.99, 399.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'casa-inteligente'), false, 80),
('iPad Air M2', 'ipad-air-m2', 'Tablet poderoso e versátil com chip M2', 4999.99, 5499.99, '/placeholder.svg', (SELECT id FROM categories WHERE slug = 'computadores'), true, 40);