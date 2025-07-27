import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowRight, Zap, Truck, Shield, Headphones, Smartphone, Laptop, Headset, ShoppingBag, Battery, Heart, Sparkles, Monitor, Gamepad2, Stethoscope, Droplets } from "lucide-react";
import { useState, useEffect } from "react";
import { Scene3D } from "./3D/Scene3D";
import heroImage from "@/assets/hero-electronics.jpg";
import heroTWSAudio from "@/assets/hero-tws-audio.jpg";
import heroGamingPC from "@/assets/hero-gaming-pc.jpg";
import heroPowerbank from "@/assets/hero-powerbank.jpg";
import heroHealthWellness from "@/assets/hero-health-wellness.jpg";
import heroSkincareBeauty from "@/assets/hero-skincare-beauty.jpg";
import heroSmartCleaning from "@/assets/hero-smart-cleaning.jpg";

const heroSlides = [
  {
    id: 1,
    title: "Tecnologia 2025",
    subtitle: "Futuro",
    description: "Smartphones com IA integrada, realidade aumentada e tecnologia quântica. O futuro chegou!",
    discount: "45%",
    badge: "AI Tech 2025",
    icon: Smartphone,
    gradient: "from-violet-600 via-purple-600 to-blue-600",
    textGradient: "from-cyan-300 to-violet-300",
    bgPattern: "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%)",
    category: "tech",
    image: heroImage
  },
  {
    id: 2,
    title: "TWS & Audio Pro",
    subtitle: "Imersão",
    description: "Fones TWS com cancelamento de ruído ativo, som espacial 3D e bateria de 48h. Audio sem limites.",
    discount: "35%",
    badge: "Audio Revolution",
    icon: Headset,
    gradient: "from-orange-500 via-pink-500 to-red-500",
    textGradient: "from-yellow-300 to-orange-300",
    bgPattern: "radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(239, 68, 68, 0.3), transparent 50%)",
    category: "audio",
    image: heroTWSAudio
  },
  {
    id: 3,
    title: "Gaming & PC Setup",
    subtitle: "Performance",
    description: "PCs gaming com RTX 50-series, processadores ultra-rápidos e periféricos pro-gaming.",
    discount: "30%",
    badge: "Gaming Beast",
    icon: Gamepad2,
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    textGradient: "from-emerald-300 to-cyan-300",
    bgPattern: "radial-gradient(circle at 40% 20%, rgba(16, 185, 129, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.3), transparent 50%)",
    category: "gaming",
    image: heroGamingPC
  },
  {
    id: 4,
    title: "PowerBanks Ultra",
    subtitle: "Energia",
    description: "PowerBanks wireless, carregamento super-rápido 200W e capacidade de até 50.000mAh.",
    discount: "25%",
    badge: "Power Tech",
    icon: Battery,
    gradient: "from-amber-500 via-yellow-500 to-lime-500",
    textGradient: "from-amber-300 to-lime-300",
    bgPattern: "radial-gradient(circle at 60% 40%, rgba(245, 158, 11, 0.3), transparent 50%), radial-gradient(circle at 20% 80%, rgba(132, 204, 22, 0.3), transparent 50%)",
    category: "power",
    image: heroPowerbank
  },
  {
    id: 5,
    title: "Saúde & Bem-Estar",
    subtitle: "Cuidado",
    description: "Dispositivos inteligentes para monitoramento de saúde, wellness tech e produtos naturais.",
    discount: "40%",
    badge: "Health Tech",
    icon: Heart,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    textGradient: "from-pink-300 to-rose-300",
    bgPattern: "radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.3), transparent 50%), radial-gradient(circle at 30% 80%, rgba(244, 63, 94, 0.3), transparent 50%)",
    category: "health",
    image: heroHealthWellness
  },
  {
    id: 6,
    title: "Skin Care & Beauty",
    subtitle: "Beleza",
    description: "Tecnologia de beleza com LED therapy, ultrassom facial e produtos orgânicos premium.",
    discount: "50%",
    badge: "Beauty Tech",
    icon: Sparkles,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    textGradient: "from-purple-300 to-pink-300",
    bgPattern: "radial-gradient(circle at 40% 60%, rgba(168, 85, 247, 0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3), transparent 50%)",
    category: "beauty",
    image: heroSkincareBeauty
  },
  {
    id: 7,
    title: "Limpeza Inteligente",
    subtitle: "Pureza",
    description: "Robôs aspiradores com IA, purificadores de ar UV-C e produtos de limpeza ecológicos.",
    discount: "35%",
    badge: "Clean Tech",
    icon: Droplets,
    gradient: "from-blue-500 via-sky-500 to-cyan-500",
    textGradient: "from-blue-300 to-cyan-300",
    bgPattern: "radial-gradient(circle at 20% 40%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(circle at 80% 60%, rgba(6, 182, 212, 0.3), transparent 50%)",
    category: "clean",
    image: heroSmartCleaning
  }
];

export const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
              {/* 3D Background */}
              <Scene3D slideIndex={index % 3} />
              
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
              <div 
                className="absolute inset-0 opacity-60"
                style={{ background: slide.bgPattern }}
              />
              <div className="absolute inset-0 bg-black/10" />
              
              {/* Parallax Layer */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1), transparent 70%)`,
                  transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                  transition: 'transform 0.3s ease-out'
                }}
              />
              
              <div className="relative min-h-screen flex items-center">
                <div className="container mx-auto px-4 py-16 lg:py-24">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-8 animate-fade-in z-10 perspective-1000">
                      <div className="space-y-6 transform-gpu">
                        <Badge 
                          variant="secondary" 
                          className="bg-white/10 text-white border-white/20 backdrop-blur-xl shadow-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                        >
                          <slide.icon className="h-4 w-4 mr-2" />
                          {slide.badge}
                        </Badge>
                        
                        <h1 
                          className="text-6xl lg:text-8xl font-black text-white leading-tight transform-gpu"
                          style={{
                            textShadow: '0 0 30px rgba(255,255,255,0.3)',
                            transform: `translateZ(50px) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`
                          }}
                        >
                          {slide.title.split(' ')[0]}
                          <span className={`block bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent drop-shadow-2xl`}>
                            {slide.subtitle}
                          </span>
                          <span className="block text-5xl lg:text-6xl mt-2">
                            {slide.title.split(' ').slice(1).join(' ')}
                          </span>
                        </h1>
                        
                        <p className="text-xl lg:text-2xl text-white/95 max-w-lg leading-relaxed backdrop-blur-sm bg-white/5 p-4 rounded-2xl border border-white/10">
                          {slide.description} 
                          <strong className={`bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}>
                            {" "}Desconto de até {slide.discount}!
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6">
                        <Button 
                          variant="hero" 
                          size="xl"
                          className="bg-white/15 text-white hover:bg-white/25 backdrop-blur-xl border border-white/20 group transition-all duration-500 hover:scale-110 hover:shadow-2xl transform-gpu"
                          style={{
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}
                        >
                          <ShoppingBag className="h-6 w-6 mr-3" />
                          Explorar Agora
                          <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="xl"
                          className="bg-transparent border-white/30 text-white hover:bg-white/10 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/50"
                        >
                          <Monitor className="h-5 w-5 mr-2" />
                          Ver Catálogo
                        </Button>
                      </div>

                      {/* Enhanced Features */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-all duration-300 transform hover:scale-105">
                          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300 border border-white/10">
                            <Truck className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-bold block">Frete Grátis</span>
                            <span className="text-xs opacity-70">Brasil todo</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-all duration-300 transform hover:scale-105">
                          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300 border border-white/10">
                            <Shield className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-bold block">Garantia</span>
                            <span className="text-xs opacity-70">2 anos</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-all duration-300 transform hover:scale-105">
                          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300 border border-white/10">
                            <Headphones className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-bold block">Suporte</span>
                            <span className="text-xs opacity-70">24/7</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white/90 group hover:text-white transition-all duration-300 transform hover:scale-105">
                          <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300 border border-white/10">
                            <Zap className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-bold block">Entrega</span>
                            <span className="text-xs opacity-70">Rápida</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced 3D Image Section */}
                    <div className="relative animate-slide-up perspective-1000">
                      <div 
                        className="relative rounded-3xl overflow-hidden shadow-2xl transform-gpu transition-all duration-700 hover:scale-105"
                        style={{
                          transform: `perspective(1000px) rotateX(${mousePosition.y * 0.02}deg) rotateY(${mousePosition.x * 0.02}deg) translateZ(20px)`,
                          boxShadow: '0 25px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)'
                        }}
                      >
                        <img 
                          src={slide.image}
                          alt={`${slide.title} - ${slide.description}`}
                          className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </div>
                      
                      {/* Enhanced Floating Cards */}
                      <div 
                        className="absolute -bottom-8 -left-8 bg-white/95 rounded-3xl p-6 shadow-2xl animate-bounce-in backdrop-blur-xl border border-white/20 transform hover:scale-105 transition-all duration-300"
                        style={{
                          transform: `translateZ(30px) rotateX(${mousePosition.y * 0.01}deg)`,
                          boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`bg-gradient-to-r ${slide.gradient} p-4 rounded-2xl shadow-lg`}>
                            <Zap className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <p className="font-black text-foreground text-lg">Oferta Exclusiva</p>
                            <p className={`text-xl font-black bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}>
                              Até {slide.discount} OFF
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* New floating stats card */}
                      <div 
                        className="absolute -top-4 -right-4 bg-white/90 rounded-2xl p-4 shadow-xl backdrop-blur-xl border border-white/20 transform hover:scale-105 transition-all duration-300"
                        style={{
                          transform: `translateZ(25px) rotateY(${mousePosition.x * 0.01}deg)`
                        }}
                      >
                        <div className="text-center">
                          <p className="text-2xl font-black text-foreground">2025</p>
                          <p className="text-xs text-muted-foreground font-medium">TECH</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Animated Elements */}
              <div 
                className="absolute top-1/4 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"
                style={{
                  transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
                }}
              />
              <div 
                className="absolute bottom-1/4 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000"
                style={{
                  transform: `translate(${mousePosition.x * -0.05}px, ${mousePosition.y * -0.05}px)`
                }}
              />
              <div 
                className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"
                style={{
                  transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                }}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur-xl transition-all duration-300 hover:scale-110 z-20" />
        <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/15 border-white/30 text-white hover:bg-white/25 backdrop-blur-xl transition-all duration-300 hover:scale-110 z-20" />
      </Carousel>

      {/* Enhanced Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-white/10 backdrop-blur-xl rounded-full p-3 border border-white/20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125 shadow-lg' 
                : 'bg-white/50 hover:bg-white/70 hover:scale-110'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-white transition-all duration-6000 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,1))'
          }}
        />
      </div>
    </section>
  );
};