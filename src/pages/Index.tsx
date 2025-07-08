import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { trackEvent } = useAnalytics();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="global"
        title={`${settings.store_name} - ${settings.store_description}`}
        description={`Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na ${settings.store_name}!`}
        keywords="eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola"
        ogImage={settings.logo_url}
      />
      <Header />
      <main>
        <Hero />
        
        {/* Banner Horizontal de Publicidade */}
        <section className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-2">Mega Promoção de Tecnologia!</h2>
                <p className="text-lg opacity-90 mb-4">Até 50% de desconto em smartphones e computadores</p>
                <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Aproveitar Agora
                </button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
          </div>
        </section>

        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
