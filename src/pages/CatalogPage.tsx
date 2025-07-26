import React from 'react';
import { products } from '../data/products';
import { CatalogProductSection } from '../components/CatalogProductSection';
import { Zap, Smartphone, Headphones } from 'lucide-react';
import '../styles/catalog.css';

// Agrupamento dos produtos por categoria
const groupedProducts = products.reduce((acc, product) => {
  if (!acc[product.category]) {
    acc[product.category] = [];
  }
  acc[product.category].push(product);
  return acc;
}, {} as Record<string, typeof products>);

// Mapeamento de ícones para cada categoria
const categoryIcons = {
  'Carregadores e Cabos': <Zap className="w-5 h-5" />,
  'Acessórios para Smartphone': <Smartphone className="w-5 h-5" />,
  'Fones de Ouvido': <Headphones className="w-5 h-5" />,
};

export const CatalogPage: React.FC = () => {
  return (
    <div className="catalog-container min-h-screen bg-gray-50">
      <div className="p-4 max-w-7xl mx-auto">
        {/* Banner de Ofertas */}
        <div className="catalog-banner text-white text-center py-6 rounded-lg mb-8">
          <h1 className="text-2xl font-bold mb-2">Ofertas e Novidades</h1>
          <p className="text-sm opacity-90">Descubra os melhores produtos de tecnologia com preços especiais</p>
        </div>

        {/* Seções de Produtos */}
        <div className="space-y-10">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <CatalogProductSection
              key={category}
              title={category}
              products={items}
              icon={categoryIcons[category as keyof typeof categoryIcons]}
            />
          ))}
        </div>

        {/* Rodapé do catálogo */}
        <div className="catalog-footer mt-16 text-center py-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">SuperLoja</h3>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Encontre os melhores produtos de tecnologia com qualidade e preços acessíveis. 
            Ofertas especiais e produtos inovadores para atender todas as suas necessidades.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            Catálogo atualizado em {new Date().toLocaleDateString('pt-AO')}
          </div>
        </div>
      </div>
    </div>
  );
};
