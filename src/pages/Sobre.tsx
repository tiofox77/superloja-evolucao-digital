import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { StaticPageLayout } from '@/components/StaticPageLayout';

const Sobre = () => {
  const sections = [
    {
      type: 'hero' as const,
      title: 'Sobre a SuperLoja Angola',
      content: 'Somos a principal loja de tecnologia e eletrônicos de Angola, oferecendo os melhores produtos com qualidade garantida e atendimento excepcional desde 2018.'
    },
    {
      type: 'text' as const,
      title: 'Nossa História',
      content: 'Fundada em 2018 em Luanda, a SuperLoja Angola nasceu com o objetivo de democratizar o acesso à tecnologia em Angola. Começamos como uma pequena loja física e hoje somos referência em comércio eletrônico, atendendo clientes em todo o país com produtos de qualidade e preços competitivos.'
    },
    {
      type: 'cards' as const,
      title: 'Nossos Valores',
      items: [
        {
          title: 'Qualidade Garantida',
          description: 'Todos os produtos passam por rigoroso controle de qualidade antes de chegar até você.',
          icon: 'check'
        },
        {
          title: 'Confiança e Segurança',
          description: 'Transações seguras e proteção total dos seus dados pessoais e financeiros.',
          icon: 'shield'
        },
        {
          title: 'Atendimento Excepcional',
          description: 'Equipe especializada pronta para ajudar em todas as etapas da sua compra.',
          icon: 'phone'
        }
      ]
    },
    {
      type: 'features' as const,
      title: 'Por que Escolher a SuperLoja?',
      items: [
        {
          title: 'Entrega em Todo Angola',
          description: 'Realizamos entregas em todas as províncias do país com frete grátis para compras acima de 50.000 AOA.',
          icon: 'location'
        },
        {
          title: 'Garantia Estendida',
          description: 'Todos os produtos têm garantia do fabricante mais nossa garantia adicional de qualidade.',
          icon: 'shield'
        },
        {
          title: 'Suporte Técnico',
          description: 'Equipe técnica especializada para ajudar com instalação e configuração dos seus produtos.',
          icon: 'check'
        },
        {
          title: 'Produtos Originais',
          description: 'Trabalhamos apenas com fornecedores autorizados, garantindo a originalidade de todos os produtos.',
          icon: 'check'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Nossa Missão',
      content: 'Conectar Angola com o futuro da tecnologia, oferecendo produtos inovadores que transformam a vida das pessoas e impulsionam o desenvolvimento do país. Acreditamos que a tecnologia deve ser acessível a todos, e trabalhamos para tornar isso realidade.'
    },
    {
      type: 'cta' as const,
      title: 'Faça Parte da Nossa História',
      content: 'Junte-se aos milhares de clientes satisfeitos que confiam na SuperLoja Angola para suas necessidades tecnológicas.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Sobre Nós - SuperLoja Angola"
        description="Conheça a SuperLoja Angola, a principal loja de tecnologia do país. Qualidade garantida e atendimento excepcional desde 2018."
      />
      <Header />
      
      <main>
        <StaticPageLayout sections={sections} />
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;