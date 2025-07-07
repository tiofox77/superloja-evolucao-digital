import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useSettings } from '@/contexts/SettingsContext';

const Contato = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "✅ Mensagem enviada!",
        description: "Recebemos sua mensagem. Retornaremos em breve."
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao enviar",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-hero-gradient bg-clip-text text-transparent mb-4">
              Entre em Contato
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Estamos aqui para ajudar! Entre em contato conosco através dos meios abaixo.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{settings.contact_email}</p>
                  <p className="text-sm text-muted-foreground">Resposta em até 24 horas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-500" />
                    Telefone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{settings.contact_phone}</p>
                  <p className="text-sm text-muted-foreground">Segunda a Sexta: 9:00 - 18:00</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">{settings.address}</p>
                  <p className="text-sm text-muted-foreground">Visite nossa loja física</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Envie sua Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Como podemos ajudar?"
                        className="min-h-[120px]"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="min-w-32"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contato;