import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  slug: string;
  rating?: number;
  reviews?: number;
  discount?: string;
  isNew?: boolean;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  image,
  slug,
  rating = 5,
  reviews = 0,
  discount,
  isNew = false,
  featured = false,
}) => {
  const { addToCart, isLoading } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(id);
  };

  return (
    <div className="product-card group">
      {/* Image container */}
      <div className="relative overflow-hidden rounded-t-xl">
        <Link to={`/produto/${slug}`}>
          <img
            src={image || '/placeholder.svg'}
            alt={name}
            className="w-full h-48 object-contain bg-background transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <Badge variant="secondary" className="bg-success text-success-foreground">
              Novo
            </Badge>
          )}
          {featured && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Destaque
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="animate-pulse">
              {discount}
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick add to cart */}
        <div className="absolute bottom-3 left-3 right-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button 
            className="w-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
            size="sm"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating
                  ? 'text-warning fill-warning'
                  : 'text-muted-foreground'
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1">
            ({reviews})
          </span>
        </div>

        {/* Product name */}
        <Link to={`/produto/${slug}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 min-h-[3rem] leading-6 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          
          {originalPrice && originalPrice > price && (
            <p className="text-xs text-success font-medium">
              Economia de {formatPrice(originalPrice - price)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" size="sm" asChild>
            <Link to={`/produto/${slug}`}>
              Ver Detalhes
            </Link>
          </Button>
          <Button 
            className="flex-1" 
            size="sm"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            {isLoading ? 'Adicionando...' : 'Comprar'}
          </Button>
        </div>
      </div>
    </div>
  );
};