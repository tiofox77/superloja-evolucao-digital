import React from 'react';
import { Product } from '../data/products';
import { CatalogProductCard } from './CatalogProductCard';
import '../styles/catalog.css';

interface CatalogProductSectionProps {
  title: string;
  products: Product[];
  icon?: React.ReactNode;
}

export const CatalogProductSection: React.FC<CatalogProductSectionProps> = ({ 
  title, 
  products, 
  icon 
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-gray-600">{icon}</div>}
        <h2 className="catalog-section-title text-xl font-bold flex items-center gap-2">
          {title}
        </h2>
      </div>
      
      <div className="catalog-grid">
        {products.map(product => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
