import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { SEOHead } from '@/components/SEOHead';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Sparkles, 
  Leaf, 
  Shield, 
  TrendingUp, 
  Star, 
  Package, 
  ShoppingCart,
  ArrowRight,
  Zap,
  Award,
  Eye
} from 'lucide-react';

const Index = () => {
  const { trackEvent } = useAnalytics();
  const { settings } = useSettings();
  const [healthProducts, setHealthProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    featuredProducts: 0
  });

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      // Carregar produtos de saúde e bem estar
      const { data: healthCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'saude-bem-estar')
        .single();

      if (healthCategory) {
        const { data: healthSubcategories } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', healthCategory.id);

        const subcategoryIds = healthSubcategories?.map(cat => cat.id) || [];
        
        if (subcategoryIds.length > 0) {
          const { data: healthProductsData } = await supabase
            .from('products')
            .select(`
              *,
              categories!inner(name, slug)
            `)
            .in('category_id', subcategoryIds)
            .eq('active', true)
            .limit(4);

          setHealthProducts(healthProductsData?.map(product => ({
            ...product,
            category_name: product.categories.name,
            category_slug: product.categories.slug
          })) || []);
        }
      }

      // Carregar produtos recentes
      const { data: recentData } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, slug)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentProducts(recentData?.map(product => ({
        ...product,
        category_name: product.categories?.name,
        category_slug: product.categories?.slug
      })) || []);

      // Carregar estatísticas
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      const { count: featuredCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('featured', true)
        .eq('active', true);

      setStats({
        totalProducts: totalProducts || 0,
        totalCategories: totalCategories || 0,
        featuredProducts: featuredCount || 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="global"
        title={`${settings.store_name} - ${settings.store_description}`}
        description={`Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na ${settings.store_name}!`}
        keywords="eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola"
        ogImage={settings.logo_url}
      />
      <Header />
      
      <main>
        <Hero />
        
        {/* Stats Overview */}
        <section className="py-16 bg-gradient-to-r from-pink-50 via-orange-50 to-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-orange-500 to-green-600 bg-clip-text text-transparent mb-4">
                SuperLoja em Números
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Conectando você aos melhores produtos com qualidade e confiança
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-8 border-0 bg-gradient-to-br from-pink-100/50 to-pink-50/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-pink-700 mb-2">{stats.totalProducts}+</div>
                <p className="text-gray-600 font-medium">Produtos Disponíveis</p>
              </Card>

              <Card className="text-center p-8 border-0 bg-gradient-to-br from-orange-100/50 to-orange-50/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-2">{stats.totalCategories}+</div>
                <p className="text-gray-600 font-medium">Categorias Organizadas</p>
              </Card>

              <Card className="text-center p-8 border-0 bg-gradient-to-br from-green-100/50 to-green-50/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-2">{stats.featuredProducts}+</div>
                <p className="text-gray-600 font-medium">Produtos em Destaque</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Banner Horizontal de Publicidade */}
        <section className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-2">Mega Promoção de Tecnologia!</h2>
                <p className="text-lg opacity-90 mb-4">Até 50% de desconto em smartphones e computadores</p>
                <Link to="/catalogo">
                  <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Aproveitar Agora
                  </button>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
          </div>
        </section>

        {/* Saúde e Bem Estar Section */}
        {healthProducts.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-pink-50/50 via-orange-50/50 to-green-50/50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 via-orange-500 to-green-500 rounded-2xl mb-6 shadow-xl">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-orange-500 to-green-600 bg-clip-text text-transparent mb-4">
                  Saúde e Bem Estar
                </h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
                  Cuide de você e da sua família com nossa linha especial de produtos naturais para higiene, limpeza e cuidados pessoais.
                </p>
                <Link to="/saude-bem-estar">
                  <Button className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white shadow-lg">
                    Ver Coleção Completa
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {healthProducts.map((product, index) => (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/70 backdrop-blur-sm animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative">
                      <div className="aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-orange-50">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-pink-300" />
                          </div>
                        )}
                      </div>
                      
                      {product.featured && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}

                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600">
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <Badge variant="outline" className="text-xs mb-2 border-pink-200 text-pink-600">
                        {product.category_name}
                      </Badge>
                      
                      <h3 className="font-semibold mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                          R$ {product.price.toFixed(2)}
                        </div>
                        <Link to={`/produto/${product.slug}`}>
                          <Button size="sm" variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                            Ver mais
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Trust Badges para Saúde */}
              <div className="bg-gradient-to-r from-pink-100/50 via-orange-100/50 to-green-100/50 rounded-2xl p-8 border border-pink-200/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Hipoalergênicos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Certificados</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">100% Natural</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Dermatologicamente Testado</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Featured Products */}
        <FeaturedProducts />
        
        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Últimos Lançamentos</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Confira os produtos mais recentes adicionados à nossa loja
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProducts.map((product, index) => (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative">
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        <Zap className="w-3 h-3 mr-1" />
                        Novo
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      {product.category_name && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {product.category_name}
                        </Badge>
                      )}
                      
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </div>
                        <Link to={`/produto/${product.slug}`}>
                          <Button size="sm" variant="outline">
                            Ver produto
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link to="/catalogo">
                  <Button variant="outline" size="lg">
                    Ver Todos os Produtos
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
        
      </main>
      <Footer />
    </div>
  );
};

export default Index;