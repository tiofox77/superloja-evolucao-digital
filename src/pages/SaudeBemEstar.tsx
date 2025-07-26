import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, User, Home, Sparkles, Leaf, Package } from 'lucide-react';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Buscar a categoria principal "Saúde e Bem Estar"
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
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Saúde e Bem Estar</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Descubra nossa linha completa de produtos para higiene, limpeza e cuidados pessoais. 
            Tudo o que você precisa para manter sua saúde e bem-estar em dia.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <Card className="h-64">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Package;
              
              return (
                <Link
                  key={category.id}
                  to={`/catalogo?categoria=${category.id}`}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 border border-border group-hover:border-primary/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-4 mx-auto group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mx-auto w-fit">
                        {category.productCount} produto{category.productCount !== 1 ? 's' : ''}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm leading-relaxed text-center">
                        {category.description || `Explore nossa seleção de ${category.name.toLowerCase()}.`}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Categorias em preparação</h3>
            <p className="text-muted-foreground">
              Estamos organizando nossos produtos de saúde e bem-estar. Volte em breve!
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Qualidade Premium</h3>
            <p className="text-muted-foreground text-sm">
              Produtos selecionados de marcas confiáveis para garantir sua satisfação.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Opções Naturais</h3>
            <p className="text-muted-foreground text-sm">
              Linha completa de produtos naturais e orgânicos para seu bem-estar.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Cuidado Completo</h3>
            <p className="text-muted-foreground text-sm">
              Tudo o que você precisa para cuidar da sua saúde e da sua família.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SaudeBemEstar;