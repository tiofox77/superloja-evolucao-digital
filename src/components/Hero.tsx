import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, Zap, Truck, Shield, Headphones, Smartphone, Laptop, Headset, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-electronics.jpg";

const heroSlides = [
  {
    id: 1,
    title: "Tecnologia de Ponta",
    subtitle: "Melhores",
    description: "Equipamentos modernos para escritório, smartphones de última geração e muito mais.",
    discount: "30%",
    badge: "Nova Coleção 2024",
    icon: Smartphone,
    gradient: "from-primary to-accent",
    textGradient: "from-primary-glow to-yellow-300"
  },
  {
    id: 2,
    title: "Computadores & Laptops",
    subtitle: "Potência",
    description: "Máquinas de alta performance para trabalho e gaming. Processadores Intel e AMD mais recentes.",
    discount: "25%",
    badge: "Gaming Collection",
    icon: Laptop,
    gradient: "from-blue-600 to-purple-600",
    textGradient: "from-blue-400 to-purple-400"
  },
  {
    id: 3,
    title: "Audio & Acessórios",
    subtitle: "Qualidade",
    description: "Fones premium, speakers e acessórios para uma experiência sonora incomparável.",
    discount: "40%",
    badge: "Audio Pro",
    icon: Headset,
    gradient: "from-orange-500 to-red-500",
    textGradient: "from-orange-300 to-red-300"
  }
];

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>();

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="relative overflow-hidden min-h-screen">
      <Carousel 
        className="w-full h-full"
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {heroSlides.map((slide, index) => (
            <CarouselItem key={slide.id} className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
              <div className="absolute inset-0 bg-black/20" />
              
              <div className="relative min-h-screen flex items-center">
                <div className="container mx-auto px-4 py-16 lg:py-24">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-8 animate-fade-in z-10">
                      <div className="space-y-6">
                        <Badge variant="secondary" className="bg-background/20 text-white border-white/20 backdrop-blur-sm">
                          <slide.icon className="h-4 w-4 mr-2" />
                          {slide.badge}
                        </Badge>
                        
                        <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                          {slide.title.split(' ')[0]} os
                          <span className={`block bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}>
                            {slide.subtitle}
                          </span>
                          {slide.title.split(' ').slice(1).join(' ')}
                        </h1>
                        
                        <p className="text-xl text-white/90 max-w-lg leading-relaxed">
                          {slide.description} 
                          <strong className={`bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}>
                            {" "}Desconto de até {slide.discount}!
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          variant="hero" 
                          size="xl"
                          className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20 group transition-all duration-300 hover:scale-105"
                        >
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Comprar Agora
                          <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="xl"
                          className="bg-transparent border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                        >
                          Ver Produtos
                        </Button>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-colors">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Truck className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">Frete Grátis</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-colors">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Shield className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">Garantia</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-colors">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Headphones className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">Suporte 24h</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-colors">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <Zap className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">Entrega Rápida</span>
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative animate-slide-up">
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                        <img 
                          src={heroImage}
                          alt="Produtos tecnológicos modernos"
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                      
                      {/* Floating offer card */}
                      <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-2xl animate-bounce-in backdrop-blur-sm border border-white/20">
                        <div className="flex items-center gap-4">
                          <div className={`bg-gradient-to-r ${slide.gradient} p-3 rounded-xl`}>
                            <Zap className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-lg">Oferta Especial</p>
                            <p className={`text-lg font-semibold bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}>
                              Até {slide.discount} OFF
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated background elements */}
              <div className="absolute top-1/4 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500" />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm" />
        <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm" />
      </Carousel>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
};