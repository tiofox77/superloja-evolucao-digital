import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingCart, Star, Truck, Shield, ArrowLeft, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Variant {
  name: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string[];
  slug: string;
  featured: boolean;
  in_stock: boolean;
  stock_quantity: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_image?: string;
  variants?: Variant[];
  categories?: {
    name: string;
  };
}

const Produto = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const { addToCart, isLoading } = useCart();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('slug', slug)
          .eq('active', true)  // Only show active products
          .single();

        if (error) throw error;
        
        // Processar variantes se existirem
        const processedData = {
          ...data,
          variants: Array.isArray(data.variants) ? data.variants : 
                   (typeof data.variants === 'string' ? JSON.parse(data.variants) : [])
        };
        
        setProduct(processedData);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        toast({
          title: "Erro",
          description: "Produto não encontrado.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, toast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    // Se a variante tem imagem, atualizar a imagem selecionada
    if (variant.image_url) {
      const variantImages = [variant.image_url, ...images];
      setSelectedImage(0); // Mostra a imagem da variante primeiro
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, quantity);
    
    // Rastrear evento de adicionar ao carrinho
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_price: selectedVariant?.price || product.price,
      quantity: quantity,
      variant: selectedVariant?.name
    });
  };

  const discountPercentage = product?.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button asChild>
            <Link to="/catalogo">Voltar ao Catálogo</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Construir array de imagens incluindo variante selecionada
  const baseImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url || '/placeholder.svg'];
  
  const images = selectedVariant?.image_url 
    ? [selectedVariant.image_url, ...baseImages.filter(img => img !== selectedVariant.image_url)]
    : baseImages;

  // Preço atual baseado na variante selecionada
  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stock_quantity || product.stock_quantity;

  // SEO dinâmico baseado no produto
  const productSEO = product ? {
    title: product.seo_title || `${product.name} - SuperLoja Angola`,
    description: product.seo_description || product.description || `Compre ${product.name} na SuperLoja com o melhor preço de Angola. ${product.description}`,
    keywords: product.seo_keywords || `${product.name}, ${product.categories?.name}, Angola, eletrônicos`,
    ogImage: product.og_image || product.image_url,
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.image_url,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "AOA",
          "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
      "brand": {
        "@type": "Brand",
        "name": "SuperLoja"
      }
    }
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <SEOHead 
          pageType="product"
          pageSlug={product.slug}
          title={productSEO.title}
          description={productSEO.description}
          keywords={productSEO.keywords}
          ogImage={productSEO.ogImage}
          schemaMarkup={productSEO.schemaMarkup}
        />
      )}
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-primary">Catálogo</Link>
          <span>/</span>
          {product.categories && (
            <>
              <span>{product.categories.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Botão Voltar */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/catalogo">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Catálogo
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Imagens */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              {product.featured && (
                <Badge variant="default">Destaque</Badge>
              )}
              {discountPercentage > 0 && (
                <Badge variant="destructive">-{discountPercentage}%</Badge>
              )}
              {product.in_stock ? (
                <Badge variant="secondary" className="bg-success text-success-foreground">
                  Em Estoque
                </Badge>
              ) : (
                <Badge variant="destructive">Fora de Estoque</Badge>
              )}
            </div>

            {/* Título */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              {product.categories && (
                <p className="text-muted-foreground">{product.categories.name}</p>
              )}
            </div>

            {/* Avaliação */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(156 avaliações)</span>
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {product.original_price && product.original_price > currentPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              
              {selectedVariant && (
                <p className="text-sm text-muted-foreground">
                  Variante selecionada: <span className="font-medium">{selectedVariant.name}</span>
                </p>
              )}
              
              {product.original_price && product.original_price > currentPrice && (
                <p className="text-success font-medium">
                  Economia de {formatPrice(product.original_price - currentPrice)}
                </p>
              )}
            </div>

            <Separator />

            {/* Descrição */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Variantes disponíveis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {product.variants.map((variant: any, index: number) => (
                     <div 
                       key={index}
                       onClick={() => handleVariantSelect(variant)}
                       className={`border rounded-lg p-3 hover:border-primary transition-colors cursor-pointer ${
                         selectedVariant?.name === variant.name ? 'border-primary bg-primary/5' : ''
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         {variant.image_url && (
                           <img 
                             src={variant.image_url} 
                             alt={variant.name}
                             className="w-12 h-12 object-cover rounded"
                           />
                         )}
                         <div className="flex-1">
                           <h4 className="font-medium">{variant.name}</h4>
                           <p className="text-sm text-primary font-semibold">
                             {formatPrice(variant.price)}
                           </p>
                           {variant.sku && (
                             <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                           )}
                           <p className="text-xs text-muted-foreground">
                             {variant.stock_quantity} em estoque
                           </p>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Quantidade</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                   <Button
                     variant="outline"
                     size="icon"
                     onClick={() => setQuantity(quantity + 1)}
                     disabled={quantity >= currentStock}
                   >
                     <Plus className="w-4 h-4" />
                   </Button>
                 </div>
                 <p className="text-sm text-muted-foreground mt-1">
                   {currentStock} unidades disponíveis
                 </p>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                 <Button
                   size="lg"
                   className="flex-1"
                   onClick={handleAddToCart}
                   disabled={!product.in_stock || isLoading || currentStock <= 0}
                 >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </Button>
                
                <Button variant="outline" size="lg">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Informações de entrega */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-primary" />
                <span>Frete grátis para todo Angola</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-primary" />
                <span>Garantia de 1 ano</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Produto;