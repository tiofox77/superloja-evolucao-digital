import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { StaticPageLayout } from '@/components/StaticPageLayout';

const PoliticaPrivacidade = () => {
  const sections = [
    {
      type: 'hero' as const,
      title: 'Política de Privacidade',
      content: 'A SuperLoja Angola valoriza sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais.'
    },
    {
      type: 'features' as const,
      title: 'Como Protegemos Seus Dados',
      items: [
        {
          title: 'Coleta de Dados',
          description: 'Coletamos apenas informações necessárias para processar pedidos e melhorar sua experiência: nome, email, telefone e endereço.',
          icon: 'shield'
        },
        {
          title: 'Uso das Informações',
          description: 'Suas informações são usadas exclusivamente para processar pedidos, comunicações e melhorar nossos serviços.',
          icon: 'check'
        },
        {
          title: 'Compartilhamento',
          description: 'Não compartilhamos suas informações com terceiros, exceto parceiros de entrega para completar seu pedido.',
          icon: 'shield'
        },
        {
          title: 'Segurança',
          description: 'Utilizamos criptografia SSL e medidas de segurança avançadas para proteger seus dados contra acesso não autorizado.',
          icon: 'check'
        }
      ]
    },
    {
      type: 'text' as const,
      title: 'Seus Direitos',
      content: 'Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco através dos nossos canais de atendimento. Respondemos a todas as solicitações em até 30 dias.'
    },
    {
      type: 'text' as const,
      title: 'Cookies e Tecnologias',
      content: 'Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas preferências e analisar o tráfego do site. Você pode desabilitar os cookies nas configurações do seu navegador, mas isso pode afetar algumas funcionalidades do site.'
    },
    {
      type: 'cta' as const,
      title: 'Dúvidas sobre Privacidade?',
      content: 'Se você tiver dúvidas sobre nossa política de privacidade ou como tratamos seus dados, entre em contato conosco.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Política de Privacidade - SuperLoja Angola"
        description="Conheça como a SuperLoja Angola protege suas informações pessoais. Política de privacidade transparente e segura."
      />
      <Header />
      
      <main>
        <StaticPageLayout sections={sections} />
      </main>

      <Footer />
    </div>
  );
};

export default PoliticaPrivacidade;