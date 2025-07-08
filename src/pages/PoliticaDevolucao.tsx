import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { StaticPageLayout } from '@/components/StaticPageLayout';

const PoliticaDevolucao = () => {
  const sections = [
    {
      type: 'hero' as const,
      title: 'Política de Devolução',
      content: 'Na SuperLoja Angola, sua satisfação é nossa prioridade. Conheça nossos termos de devolução e troca.'
    },
    {
      type: 'features' as const,
      title: 'Condições para Devolução',
      items: [
        {
          title: 'Prazo de 7 Dias',
          description: 'Você tem até 7 dias corridos após o recebimento para solicitar a devolução do produto.',
          icon: 'clock'
        },
        {
          title: 'Produto Íntegro',
          description: 'O produto deve estar em perfeitas condições, sem uso, na embalagem original com todos os acessórios.',
          icon: 'check'
        },
        {
          title: 'Nota Fiscal',
          description: 'É necessário apresentar a nota fiscal ou comprovante de compra para processar a devolução.',
          icon: 'check'
        },
        {
          title: 'Devolução Gratuita',
          description: 'Para produtos com defeito ou divergência, a devolução é gratuita. Outros casos podem ter custo de frete.',
          icon: 'shield'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Como Solicitar Devolução',
      content: 'Para solicitar uma devolução, entre em contato conosco via WhatsApp (+244 923 456 789) ou email (contato@superloja.ao) informando o número do pedido e o motivo da devolução. Nossa equipe irá orientá-lo sobre os próximos passos e, se necessário, agendar a coleta do produto.'
    },
    {
      type: 'cards' as const,
      title: 'Produtos Não Aceitos para Devolução',
      items: [
        {
          title: 'Produtos Personalizados',
          description: 'Itens feitos sob medida ou personalizados especificamente para o cliente.',
          icon: 'check'
        },
        {
          title: 'Produtos de Higiene',
          description: 'Produtos que por questões de saúde e higiene não podem ser devolvidos após uso.',
          icon: 'check'
        },
        {
          title: 'Software Aberto',
          description: 'Produtos digitais que já foram baixados ou códigos de licença utilizados.',
          icon: 'check'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Reembolso',
      content: 'Após a aprovação da devolução, o reembolso será processado em até 5 dias úteis na mesma forma de pagamento utilizada na compra. Para pagamentos via transferência, será necessário informar os dados bancários para depósito.'
    },
    {
      type: 'cta' as const,
      title: 'Precisa Devolver um Produto?',
      content: 'Nossa equipe está pronta para ajudar com sua solicitação de devolução de forma rápida e eficiente.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Política de Devolução - SuperLoja Angola"
        description="Conheça nossa política de devolução. Processo simples e seguro para devoluções e trocas na SuperLoja Angola."
      />
      <Header />
      
      <main>
        <StaticPageLayout sections={sections} />
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaDevolucao;