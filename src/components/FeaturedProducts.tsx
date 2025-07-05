import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";

// Mock data - em produção virá de uma API
const featuredProducts = [
  {
    id: "1",
    name: "MacBook Pro 14\" M3 - 512GB SSD, 16GB RAM",
    price: 890000,
    originalPrice: 1200000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
    rating: 5,
    reviews: 128,
    inStock: true,
    isNew: true,
    discount: 26
  },
  {
    id: "2", 
    name: "iPhone 15 Pro Max 256GB - Titânio Natural",
    price: 650000,
    originalPrice: 750000,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
    rating: 5,
    reviews: 95,
    inStock: true,
    discount: 13
  },
  {
    id: "3",
    name: "Samsung Galaxy S24 Ultra 512GB",
    price: 580000,
    originalPrice: 680000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
    rating: 4,
    reviews: 76,
    inStock: true,
    discount: 15
  },
  {
    id: "4",
    name: "AirPods Pro 2ª Geração com Case MagSafe",
    price: 89000,
    originalPrice: 120000,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=300&fit=crop",
    rating: 5,
    reviews: 203,
    inStock: true,
    isNew: true,
    discount: 26
  },
  {
    id: "5",
    name: "Dell XPS 13 Plus - Intel i7, 16GB, 1TB SSD",
    price: 720000,
    originalPrice: 850000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    rating: 4,
    reviews: 45,
    inStock: true,
    discount: 15
  },
  {
    id: "6",
    name: "iPad Pro 12.9\" M2 256GB Wi-Fi",
    price: 450000,
    originalPrice: 520000,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
    rating: 5,
    reviews: 87,
    inStock: false,
    discount: 13
  },
  {
    id: "7",
    name: "Sony WH-1000XM5 Headphones Noise Cancelling",
    price: 125000,
    originalPrice: 150000,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
    rating: 5,
    reviews: 156,
    inStock: true,
    discount: 17
  },
  {
    id: "8",
    name: "Apple Watch Series 9 GPS + Cellular 45mm",
    price: 180000,
    originalPrice: 220000,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=300&fit=crop",
    rating: 4,
    reviews: 92,
    inStock: true,
    isNew: true,
    discount: 18
  }
];

export const FeaturedProducts = () => {
  const handleAddToCart = (productId: string) => {
    console.log("Adicionado ao carrinho:", productId);
    // Aqui você implementaria a lógica do carrinho
  };

  const handleToggleFavorite = (productId: string) => {
    console.log("Favorito alternado:", productId);
    // Aqui você implementaria a lógica de favoritos
  };

  const handleQuickView = (productId: string) => {
    console.log("Visualização rápida:", productId);
    // Aqui você implementaria o modal de visualização rápida
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-3xl lg:text-4xl font-bold bg-hero-gradient bg-clip-text text-transparent">
              Ofertas Quentes do Dia
            </h2>
            <Flame className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Produtos selecionados com os melhores preços. Ofertas limitadas e por tempo limitado!
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product, index) => (
            <div 
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard
                {...product}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                onQuickView={handleQuickView}
              />
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center animate-bounce-in">
          <Button variant="hero" size="xl" className="group">
            Ver Todos os Produtos
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};