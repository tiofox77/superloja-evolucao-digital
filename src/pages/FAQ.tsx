import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ = () => {
  const faqData = [
    {
      question: "Como posso fazer um pedido?",
      answer: "Para fazer um pedido, navegue pelos nossos produtos, adicione os itens desejados ao carrinho e prossiga para o checkout. Você pode pagar através de transferência bancária, Multicaixa Express ou dinheiro na entrega."
    },
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer: "Aceitamos transferência bancária, Multicaixa Express, dinheiro na entrega e cartões de crédito/débito. Todas as transações são seguras e protegidas."
    },
    {
      question: "Quanto tempo demora a entrega?",
      answer: "Para Luanda, a entrega é feita em 24-48 horas. Para outras províncias, o prazo varia de 3 a 7 dias úteis, dependendo da localização."
    },
    {
      question: "A entrega é gratuita?",
      answer: "Sim! Oferecemos frete grátis para todo Angola em compras acima de 50.000 AOA. Para valores menores, aplicamos uma taxa de entrega."
    },
    {
      question: "Os produtos têm garantia?",
      answer: "Todos os nossos produtos possuem garantia do fabricante, além da nossa garantia adicional de qualidade. O período varia conforme o produto, geralmente de 6 meses a 2 anos."
    },
    {
      question: "Posso devolver um produto?",
      answer: "Sim, você tem até 7 dias após o recebimento para solicitar a devolução, desde que o produto esteja em perfeitas condições e na embalagem original."
    },
    {
      question: "Como posso acompanhar meu pedido?",
      answer: "Após a confirmação do pedido, enviaremos um código de rastreamento via WhatsApp ou email. Você também pode entrar em contato conosco para atualizações."
    },
    {
      question: "Vocês têm loja física?",
      answer: "Sim, nossa loja física fica na Rua dos Coqueiros, 123, em Luanda. Funcionamos de segunda a sexta das 8h às 18h, e aos sábados das 8h às 14h."
    },
    {
      question: "Como posso entrar em contato com o suporte?",
      answer: "Você pode nos contatar via WhatsApp (+244 923 456 789), email (contato@superloja.ao) ou visitando nossa loja física. Nosso atendimento é rápido e especializado."
    },
    {
      question: "Os produtos são originais?",
      answer: "Sim, trabalhamos apenas com fornecedores autorizados e garantimos a originalidade de todos os produtos. Emitimos nota fiscal para todas as vendas."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="custom"
        title="Perguntas Frequentes - SuperLoja Angola"
        description="Encontre respostas para as dúvidas mais comuns sobre produtos, entregas, pagamentos e garantias na SuperLoja Angola."
      />
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h1>
            <p className="text-xl text-muted-foreground">
              Encontre respostas para as dúvidas mais comuns sobre nossos produtos e serviços
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-medium text-foreground">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Não encontrou sua resposta?
            </h2>
            <p className="text-muted-foreground mb-8">
              Nossa equipe está pronta para ajudar com qualquer dúvida específica
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/244923456789"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                WhatsApp
              </a>
              <a 
                href="mailto:contato@superloja.ao"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;