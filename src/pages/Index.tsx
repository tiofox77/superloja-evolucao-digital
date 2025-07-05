import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [cartCount, setCartCount] = useState(3); // Exemplo de estado do carrinho

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} />
      <main>
        <Hero />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
