import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLayout } from '@/contexts/LayoutContext';
import { SEOHead } from '@/components/SEOHead';

const Contato = () => {
  const { getLayoutSetting, loading } = useLayout();
  const contactSettings = getLayoutSetting('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envio do formulário
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Mensagem enviada!",
      description: "Entraremos em contato em breve. Obrigado!",
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </main>
        <Footer />
      </div>
    );
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Endereço',
      info: 'Rua das Tecnologias, 123\nSão Paulo - SP, 01234-567'
    },
    {
      icon: Phone,
      title: 'Telefone',
      info: '(11) 1234-5678\n(11) 98765-4321'
    },
    {
      icon: Mail,
      title: 'E-mail',
      info: 'contato@superloja.com.br\nvendas@superloja.com.br'
    },
    {
      icon: Clock,
      title: 'Horário',
      info: 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 14h'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={contactSettings?.title || "Contato - SuperLoja"}
        description="Entre em contato conosco. Estamos prontos para ajudar você com os melhores produtos tecnológicos."
      />
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              {contactSettings?.title || 'Entre em Contato'}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in opacity-90">
              {contactSettings?.subtitle || 'Estamos aqui para ajudar! Fale conosco através dos canais abaixo ou envie uma mensagem diretamente.'}
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactSettings?.contact_methods?.map((method: any, index: number) => (
                <Card key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {method.type === 'phone' && <Phone className="w-6 h-6 text-primary" />}
                      {method.type === 'email' && <Mail className="w-6 h-6 text-primary" />}
                      {method.type === 'whatsapp' && <MessageCircle className="w-6 h-6 text-primary" />}
                      {method.type === 'address' && <MapPin className="w-6 h-6 text-primary" />}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{method.label}</h3>
                    <p className="text-sm text-muted-foreground">{method.value}</p>
                  </CardContent>
                </Card>
              ))}
              
              {/* Horários de Funcionamento */}
              {contactSettings?.business_hours && (
                <Card className="text-center animate-fade-in">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Horário</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Seg-Sex:</span>
                        <Badge variant="outline" className="text-xs">
                          {contactSettings.business_hours.weekdays}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Sábado:</span>
                        <Badge variant="outline" className="text-xs">
                          {contactSettings.business_hours.saturday}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Domingo:</span>
                        <Badge variant="secondary" className="text-xs">
                          {contactSettings.business_hours.sunday}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject">Assunto *</Label>
                          <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Como podemos ajudar?"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message">Mensagem *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Descreva sua dúvida ou solicitação..."
                          rows={5}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Enviando..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Map/Additional Info */}
              <div className="animate-fade-in">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Nossa Localização</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Mapa da localização</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-foreground mb-4">Outros Canais</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💬</span>
                          <div>
                            <p className="font-medium">WhatsApp</p>
                            <p className="text-sm text-muted-foreground">(11) 98765-4321</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-medium">Redes Sociais</p>
                            <p className="text-sm text-muted-foreground">@superloja</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎧</span>
                          <div>
                            <p className="font-medium">Suporte Técnico</p>
                            <p className="text-sm text-muted-foreground">suporte@superloja.com.br</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contato;