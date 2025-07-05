import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "@/pages/Index";
import Catalogo from "@/pages/Catalogo";
import Produto from "@/pages/Produto";
import Categorias from "@/pages/Categorias";
import Sobre from "@/pages/Sobre";
import Contato from "@/pages/Contato";
import Checkout from "@/pages/Checkout";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/produto/:slug" element={<Produto />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        <Toaster />
      </Router>
    </CartProvider>
  );
}

export default App;
