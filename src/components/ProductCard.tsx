import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  isNew?: boolean;
  discount?: number;
  onAddToCart?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onQuickView?: (id: string) => void;
}

export const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating = 0,
  reviews = 0,
  inStock = true,
  isNew = false,
  discount,
  onAddToCart,
  onToggleFavorite,
  onQuickView
}: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    onAddToCart?.(id);
    setIsLoading(false);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.(id);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="product-card group">
      {/* Image container */}
      <div className="relative overflow-hidden rounded-t-xl bg-card">
        <img 
          src={image} 
          alt={name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <Badge variant="default" className="bg-success text-success-foreground">
              Novo
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="animate-pulse">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
            onClick={() => onQuickView?.(id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick add to cart on hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button
            variant="cart"
            className="w-full shadow-glow"
            onClick={handleAddToCart}
            disabled={!inStock || isLoading}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-4 space-y-3">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>
        )}

        {/* Product name */}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">
            {formatPrice(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Stock status */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${
            inStock 
              ? 'text-success' 
              : 'text-destructive'
          }`}>
            {inStock ? '✅ Em estoque' : '❌ Indisponível'}
          </span>
          
          {inStock && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-foreground hover:bg-primary"
              onClick={handleAddToCart}
              disabled={isLoading}
            >
              {isLoading ? 'Adicionando...' : 'Comprar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};