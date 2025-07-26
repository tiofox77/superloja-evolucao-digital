-- Inserir categoria principal "Saúde e Bem Estar"
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Saúde e Bem Estar', 'saude-bem-estar', 'Produtos de higiene, limpeza e cuidados pessoais', 'heart');

-- Inserir subcategorias de higiene e limpeza
INSERT INTO public.categories (name, slug, description, parent_id, icon) VALUES
('Higiene Pessoal', 'higiene-pessoal', 'Produtos para cuidados pessoais e higiene', 
  (SELECT id FROM categories WHERE slug = 'saude-bem-estar'), 'user'),
('Limpeza Doméstica', 'limpeza-domestica', 'Produtos de limpeza para casa', 
  (SELECT id FROM categories WHERE slug = 'saude-bem-estar'), 'home'),
('Cuidados com o Corpo', 'cuidados-corpo', 'Cremes, loções e produtos para o corpo', 
  (SELECT id FROM categories WHERE slug = 'saude-bem-estar'), 'sparkles'),
('Produtos Naturais', 'produtos-naturais', 'Produtos orgânicos e naturais', 
  (SELECT id FROM categories WHERE slug = 'saude-bem-estar'), 'leaf');