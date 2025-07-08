import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SEOHead } from '@/components/SEOHead';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Grid, List, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_url?: string;
  slug: string;
  featured: boolean;
  category_id?: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Catalogo = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [availability, setAvailability] = useState<string>('all');
  const [featured, setFeatured] = useState<boolean>(false);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Buscar produtos
        let query = supabase
          .from('products')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('active', true);  // Only show active products

        // Filtrar por categoria se selecionada
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory);
        }

        // Filtrar por busca
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        // Filtrar por faixa de preço
        if (priceRange !== 'all') {
          switch (priceRange) {
            case 'under-5000':
              query = query.lt('price', 5000);
              break;
            case '5000-20000':
              query = query.gte('price', 5000).lte('price', 20000);
              break;
            case '20000-50000':
              query = query.gte('price', 20000).lte('price', 50000);
              break;
            case 'over-50000':
              query = query.gt('price', 50000);
              break;
          }
        }

        // Filtrar por disponibilidade
        if (availability !== 'all') {
          query = query.eq('in_stock', availability === 'in-stock');
        }

        // Filtrar produtos em destaque
        if (featured) {
          query = query.eq('featured', true);
        }

        // Ordenar
        switch (sortBy) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'name':
          default:
            query = query.order('name');
            break;
        }

        const { data: productsData, error: productsError } = await query;

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery, sortBy, priceRange, availability, featured]);

  // Rastrear pesquisas
  const handleSearch = (term: string) => {
    setSearchQuery(term);
    if (term.length > 2) {
      trackEvent('search', { query: term, results_count: products.length });
    }
  };

  // Rastrear filtros por categoria
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    trackEvent('filter_category', { category: categoryId });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="category"
        title="Catálogo de Produtos - SuperLoja Angola"
        description="Explore nossa ampla variedade de produtos eletrônicos. Smartphones, computadores, acessórios e muito mais com os melhores preços de Angola."
        keywords="catálogo Angola, produtos eletrônicos, smartphones Angola, computadores Luanda"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">
            Encontre os melhores produtos de tecnologia com preços incríveis
          </p>
        </div>

        {/* Banner de Publicidade Horizontal */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">🔥 Ofertas Especiais!</h2>
              <p className="text-muted-foreground mb-4">Descubra os melhores preços em tecnologia. Promoções limitadas!</p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Ver Ofertas
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-lg p-6 mb-8 shadow-card">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categoria */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="price_asc">Menor Preço</SelectItem>
                  <SelectItem value="price_desc">Maior Preço</SelectItem>
                </SelectContent>
              </Select>

              {/* Modo de visualização */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filtros Adicionais */}
            <div className="flex flex-wrap gap-4">
              {/* Faixa de Preço */}
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Faixa de preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os preços</SelectItem>
                  <SelectItem value="under-5000">Até 5.000 Kz</SelectItem>
                  <SelectItem value="5000-20000">5.000 - 20.000 Kz</SelectItem>
                  <SelectItem value="20000-50000">20.000 - 50.000 Kz</SelectItem>
                  <SelectItem value="over-50000">Acima de 50.000 Kz</SelectItem>
                </SelectContent>
              </Select>

              {/* Disponibilidade */}
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="in-stock">Em estoque</SelectItem>
                  <SelectItem value="out-of-stock">Fora de estoque</SelectItem>
                </SelectContent>
              </Select>

              {/* Produtos em Destaque */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm text-muted-foreground flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Apenas em destaque
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Coluna Principal - Produtos */}
          <div className="flex-1">
            {/* Produtos */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-muted rounded-xl h-72"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou termos de busca
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange('all');
                  setAvailability('all');
                  setFeatured(false);
                }}>
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.original_price}
                      image={product.image_url || '/placeholder.svg'}
                      slug={product.slug}
                      featured={product.featured}
                      rating={5}
                      reviews={Math.floor(Math.random() * 500) + 50}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Banner Vertical de Publicidade */}
          <div className="hidden lg:block w-64">
            <div className="sticky top-24">
              <div className="bg-gradient-to-b from-accent/10 to-primary/10 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Produtos Premium</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Descubra nossa linha exclusiva de produtos de alta qualidade
                </p>
                <Button size="sm" className="w-full">
                  Explorar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && products.length > 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            Mostrando {products.length} produto{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Catalogo;