import React from 'react';
import { Product } from '../data/products';
import '../styles/catalog.css';

interface CatalogProductCardProps {
  product: Product;
}

export const CatalogProductCard: React.FC<CatalogProductCardProps> = ({ product }) => {
  return (
    <div className="catalog-product-card bg-white shadow-sm hover:shadow-md p-4 cursor-pointer">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="catalog-product-image w-full h-28 object-contain mb-3"
          onError={(e) => {
            // Fallback para imagem padrão se a imagem não carregar
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/f3f4f6/9ca3af?text=Produto';
          }}
        />
        
        {product.badge && (
          <span className={`catalog-badge ${product.badge === 'NOVIDADE' ? 'novidade' : 'destaque'}`}>
            {product.badge}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <p className="catalog-price">
          {product.price}
        </p>
      </div>
    </div>
  );
};
