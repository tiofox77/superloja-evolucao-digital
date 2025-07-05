import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Shield, Headphones, Star, Users, Award, Target } from 'lucide-react';

const Sobre = () => {
  const stats = [
    { label: 'Anos no Mercado', value: '10+', icon: Award },
    { label: 'Produtos Vendidos', value: '50K+', icon: Star },
    { label: 'Clientes Satisfeitos', value: '15K+', icon: Users },
    { label: 'Avaliação Média', value: '4.9/5', icon: Target },
  ];

  const values = [
    {
      icon: Truck,
      title: 'Entrega Rápida',
      description: 'Entregamos seus produtos com agilidade e segurança em todo o Brasil'
    },
    {
      icon: Shield,
      title: 'Garantia Total',
      description: 'Todos os produtos com garantia do fabricante e suporte completo'
    },
    {
      icon: Headphones,
      title: 'Suporte 24/7',
      description: 'Atendimento especializado disponível todos os dias da semana'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Sobre a SuperLoja
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in opacity-90">
              Sua loja de tecnologia moderna, oferecendo os melhores produtos 
              com preços competitivos e atendimento excepcional há mais de 10 anos.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-foreground mb-6">Nossa História</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    A SuperLoja nasceu em 2014 com uma missão simples: democratizar o acesso 
                    à tecnologia de qualidade no Brasil. Começamos como uma pequena loja física 
                    em São Paulo e hoje somos uma das principais referências em e-commerce 
                    de tecnologia do país.
                  </p>
                  <p>
                    Nossa paixão por inovação e compromisso com a satisfação do cliente nos 
                    levaram a construir relacionamentos duradouros com mais de 15.000 clientes 
                    em todo o território nacional.
                  </p>
                  <p>
                    Trabalhamos diretamente com os principais fabricantes mundiais para 
                    garantir produtos originais, preços competitivos e a melhor experiência 
                    de compra possível.
                  </p>
                </div>
              </div>
              
              <div className="animate-fade-in">
                <img
                  src="/placeholder.svg"
                  alt="Nossa equipe"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Nossos Diferenciais</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                O que nos torna únicos no mercado de tecnologia
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6 animate-fade-in">Nossa Missão</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 animate-fade-in">
                "Conectar pessoas à tecnologia que transforma vidas, oferecendo produtos 
                inovadores com excelência no atendimento e preços justos, construindo 
                relacionamentos duradouros baseados na confiança e satisfação."
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 animate-fade-in">
                <Badge variant="secondary" className="px-4 py-2">Inovação</Badge>
                <Badge variant="secondary" className="px-4 py-2">Qualidade</Badge>
                <Badge variant="secondary" className="px-4 py-2">Confiança</Badge>
                <Badge variant="secondary" className="px-4 py-2">Excelência</Badge>
                <Badge variant="secondary" className="px-4 py-2">Satisfação</Badge>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;