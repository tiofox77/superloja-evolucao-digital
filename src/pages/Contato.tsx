import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { StaticPageLayout } from '@/components/StaticPageLayout';

const Contato = () => {
  const sections = [
    {
      type: 'hero' as const,
      title: 'Entre em Contato',
      content: 'Estamos aqui para ajudar! Entre em contato conosco através dos nossos canais de atendimento e teremos prazer em responder às suas dúvidas.'
    },
    {
      type: 'contact' as const,
      title: 'Nossos Canais de Atendimento',
      items: [
        {
          title: 'WhatsApp',
          description: '+244 923 456 789\nAtendimento rápido via WhatsApp, de segunda a sábado das 8h às 18h.',
          icon: 'phone'
        },
        {
          title: 'Email',
          description: 'contato@superloja.ao\nEnvie suas dúvidas por email e responderemos em até 24 horas.',
          icon: 'mail'
        },
        {
          title: 'Localização',
          description: 'Rua dos Coqueiros, 123\nLuanda, Angola\nVisite nossa loja física.',
          icon: 'location'
        },
        {
          title: 'Horário de Funcionamento',
          description: 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 14h\nDomingo: Fechado',
          icon: 'clock'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Suporte Especializado',
      content: 'Nossa equipe de suporte está preparada para ajudar com dúvidas sobre produtos, pedidos, entregas e qualquer questão relacionada à sua experiência de compra na SuperLoja Angola.'
    },
    {
      type: 'cta' as const,
      title: 'Precisa de Ajuda Imediata?',
      content: 'Nossa equipe está pronta para atender você. Entre em contato através do WhatsApp para atendimento rápido e personalizado.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Contato - SuperLoja Angola"
        description="Entre em contato com a SuperLoja Angola. WhatsApp, email e atendimento personalizado para suas dúvidas."
      />
      <Header />
      
      <main>
        <StaticPageLayout sections={sections} />
      </main>

      <Footer />
    </div>
  );
};

export default Contato;