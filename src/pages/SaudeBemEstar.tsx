import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  User, 
  Home, 
  Sparkles, 
  Leaf, 
  Package, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Star,
  ShoppingCart,
  Eye
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  featured: boolean;
  category_name: string;
  category_slug: string;
  in_stock: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
}

const iconMap = {
  heart: Heart,
  user: User,
  home: Home,
  sparkles: Sparkles,
  leaf: Leaf,
};

const SaudeBemEstar = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar categoria principal
        const { data: mainCategory, error: mainError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', 'saude-bem-estar')
          .single();

        if (mainError) throw mainError;

        // Buscar subcategorias
        const { data: subcategories, error: subError } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', mainCategory.id);

        if (subError) throw subError;

        // Buscar produtos das subcategorias
        const categoryIds = subcategories?.map(cat => cat.id) || [];
        if (categoryIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              categories!inner(name, slug)
            `)
            .in('category_id', categoryIds)
            .eq('active', true);

          if (productsError) throw productsError;

          const formattedProducts = productsData?.map(product => ({
            ...product,
            category_name: product.categories.name,
            category_slug: product.categories.slug
          })) || [];

          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
        }

        // Contar produtos para cada subcategoria
        const categoriesWithCount = await Promise.all(
          (subcategories || []).map(async (category) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)
              .eq('active', true);

            return {
              ...category,
              productCount: count || 0
            };
          })
        );

        setCategories(categoriesWithCount);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar produtos
  useEffect(() => {
    let filtered = [...products];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_slug === selectedCategory);
    }

    // Filtro por preço
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filtro por estoque
    if (showInStockOnly) {
      filtered = filtered.filter(product => product.in_stock);
    }

    // Filtro por destaque
    if (showFeaturedOnly) {
      filtered = filtered.filter(product => product.featured);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'featured':
          return b.featured ? 1 : -1;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, priceRange, showInStockOnly, showFeaturedOnly, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="lg:col-span-3 space-y-4">
                <div className="h-12 bg-muted rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-80 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 mb-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mb-6 shadow-lg">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
              Saúde e Bem Estar
            </h1>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Descubra nossa linha completa de produtos para higiene, limpeza e cuidados pessoais. 
              Tudo o que você precisa para manter sua saúde e bem-estar em dia.
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{products.length}</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{products.filter(p => p.featured).length}</div>
                <div className="text-sm text-muted-foreground">Destaques</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filtros */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-card/50 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Filtros</h3>
                </div>

                {/* Busca */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Buscar produtos</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Digite o nome do produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Categorias */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name} ({category.productCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Faixa de Preço */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-stock"
                        checked={showInStockOnly}
                        onCheckedChange={(checked) => setShowInStockOnly(checked === true)}
                      />
                      <label htmlFor="in-stock" className="text-sm">
                        Apenas em estoque
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={showFeaturedOnly}
                        onCheckedChange={(checked) => setShowFeaturedOnly(checked === true)}
                      />
                      <label htmlFor="featured" className="text-sm">
                        Apenas produtos em destaque
                      </label>
                    </div>
                  </div>
                </div>

                {/* Category Quick Links */}
                <div className="mt-8">
                  <h4 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                    Categorias Rápidas
                  </h4>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Package;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.slug)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-primary/10 ${
                            selectedCategory === category.slug ? 'bg-primary/10 border border-primary/20' : ''
                          }`}
                        >
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium flex-1 text-left">{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {category.productCount}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-1">
                  {filteredProducts.length} Produto{filteredProducts.length !== 1 ? 's' : ''} Encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {selectedCategory !== 'all' 
                    ? `Na categoria: ${categories.find(c => c.slug === selectedCategory)?.name}`
                    : 'Em todas as categorias'
                  }
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                    <SelectItem value="price-asc">Menor preço</SelectItem>
                    <SelectItem value="price-desc">Maior preço</SelectItem>
                    <SelectItem value="featured">Destaques primeiro</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar os filtros ou fazer uma nova busca.
                </p>
                <Button onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setShowInStockOnly(false);
                  setShowFeaturedOnly(false);
                }}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {viewMode === 'grid' ? (
                      <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm">
                        <div className="relative">
                          <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {product.featured && (
                              <Badge className="bg-primary text-primary-foreground">
                                <Star className="w-3 h-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                            {!product.in_stock && (
                              <Badge variant="destructive">Sem estoque</Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" className="h-8 w-8 p-0">
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {product.category_name}
                            </Badge>
                          </div>
                          
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-primary">
                                R$ {product.price.toFixed(2)}
                              </div>
                              {product.original_price && product.original_price > product.price && (
                                <div className="text-sm text-muted-foreground line-through">
                                  R$ {product.original_price.toFixed(2)}
                                </div>
                              )}
                            </div>
                            
                            <Link to={`/produto/${product.slug}`}>
                              <Button size="sm" variant="outline">
                                Ver mais
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {product.category_name}
                                    </Badge>
                                    {product.featured && (
                                      <Badge className="bg-primary text-primary-foreground text-xs">
                                        <Star className="w-3 h-3 mr-1" />
                                        Destaque
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                    {product.name}
                                  </h3>
                                  
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                      {product.description}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right ml-4">
                                  <div className="text-lg font-bold text-primary">
                                    R$ {product.price.toFixed(2)}
                                  </div>
                                  {product.original_price && product.original_price > product.price && (
                                    <div className="text-sm text-muted-foreground line-through">
                                      R$ {product.original_price.toFixed(2)}
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Ver
                                    </Button>
                                    <Button size="sm">
                                      <ShoppingCart className="w-4 h-4 mr-1" />
                                      Comprar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center p-8 border-0 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-3">Qualidade Premium</h3>
            <p className="text-muted-foreground leading-relaxed">
              Produtos selecionados de marcas confiáveis para garantir sua total satisfação e bem-estar.
            </p>
          </Card>
          
          <Card className="text-center p-8 border-0 bg-gradient-to-br from-secondary/5 to-transparent">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-2xl mb-6">
              <Leaf className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-semibold text-xl mb-3">Opções Naturais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Linha completa de produtos naturais e orgânicos para cuidar de você e da natureza.
            </p>
          </Card>
          
          <Card className="text-center p-8 border-0 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-3">Cuidado Completo</h3>
            <p className="text-muted-foreground leading-relaxed">
              Tudo o que você precisa para cuidar da sua saúde e da sua família em um só lugar.
            </p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SaudeBemEstar;