import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { StaticPageLayout } from '@/components/StaticPageLayout';

const TermosUso = () => {
  const sections = [
    {
      type: 'hero' as const,
      title: 'Termos de Uso',
      content: 'Estes termos definem as condições de uso da SuperLoja Angola. Ao utilizar nossos serviços, você concorda com estes termos.'
    },
    {
      type: 'features' as const,
      title: 'Principais Termos',
      items: [
        {
          title: 'Uso Responsável',
          description: 'O usuário compromete-se a utilizar o site de forma responsável, não prejudicando outros usuários ou o funcionamento da plataforma.',
          icon: 'shield'
        },
        {
          title: 'Informações Precisas',
          description: 'É responsabilidade do usuário fornecer informações verdadeiras e atualizadas durante o cadastro e nas compras.',
          icon: 'check'
        },
        {
          title: 'Propriedade Intelectual',
          description: 'Todo o conteúdo do site é protegido por direitos autorais e não pode ser reproduzido sem autorização.',
          icon: 'shield'
        },
        {
          title: 'Limitação de Responsabilidade',
          description: 'A SuperLoja Angola não se responsabiliza por danos indiretos decorrentes do uso inadequado dos produtos.',
          icon: 'check'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Condições de Compra',
      content: 'Ao realizar uma compra, você concorda com nossos preços, condições de entrega e políticas de devolução. Os preços podem ser alterados sem aviso prévio. A confirmação do pedido está sujeita à disponibilidade dos produtos e aprovação do pagamento.'
    },
    {
      type: 'text' as const,
      title: 'Alterações nos Termos',
      content: 'A SuperLoja Angola reserva-se o direito de alterar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site. É responsabilidade do usuário verificar periodicamente os termos atualizados.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Termos de Uso - SuperLoja Angola"
        description="Conheça os termos de uso da SuperLoja Angola. Condições de compra, responsabilidades e direitos dos usuários."
      />
      <Header />
      
      <main>
        <StaticPageLayout sections={sections} />
      </main>

      <Footer />
    </div>
  );
};

export default TermosUso;