import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useAnalytics } from "@/hooks/useAnalytics";

const Index = () => {
  const { trackEvent } = useAnalytics();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        pageType="global"
        title="SuperLoja - A melhor loja de eletrônicos de Angola"
        description="Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na SuperLoja!"
        keywords="eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola"
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
