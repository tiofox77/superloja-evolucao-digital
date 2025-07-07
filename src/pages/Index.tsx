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
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
