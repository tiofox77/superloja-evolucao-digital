import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Truck, Shield, Headphones } from "lucide-react";
import heroImage from "@/assets/hero-electronics.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-background/20 text-primary-foreground border-primary-foreground/20">
                <Zap className="h-4 w-4 mr-2" />
                Nova Coleção 2024
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                Encontre os
                <span className="block bg-gradient-to-r from-primary-glow to-yellow-300 bg-clip-text text-transparent">
                  Melhores
                </span>
                Produtos Tech
              </h1>
              
              <p className="text-xl text-primary-foreground/90 max-w-lg">
                Equipamentos modernos para escritório, smartphones de última geração e muito mais. 
                Descontos de até <strong>30%</strong> na primeira compra!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="xl"
                className="bg-background/20 text-primary-foreground hover:bg-background/30 backdrop-blur-sm border border-primary-foreground/20 group"
              >
                Comprar Agora
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="xl"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-background/10"
              >
                Ver Catálogo
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Truck className="h-5 w-5 text-primary-glow" />
                <span className="text-sm font-medium">Frete Grátis</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Shield className="h-5 w-5 text-primary-glow" />
                <span className="text-sm font-medium">Garantia</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Headphones className="h-5 w-5 text-primary-glow" />
                <span className="text-sm font-medium">Suporte 24h</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Zap className="h-5 w-5 text-primary-glow" />
                <span className="text-sm font-medium">Entrega Rápida</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-slide-up">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroImage}
                alt="Produtos tecnológicos modernos"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            
            {/* Floating offer card */}
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl p-4 shadow-elegant animate-bounce-in">
              <div className="flex items-center gap-3">
                <div className="bg-hero-gradient p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Oferta Especial</p>
                  <p className="text-sm text-muted-foreground">Até 30% OFF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-1/4 right-10 w-32 h-32 bg-primary-glow/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl animate-pulse delay-1000" />
    </section>
  );
};