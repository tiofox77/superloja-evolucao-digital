import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "@/pages/Index";
import Catalogo from "@/pages/Catalogo";
import Produto from "@/pages/Produto";
import Categorias from "@/pages/Categorias";
import Sobre from "@/pages/Sobre";
import Checkout from "@/pages/Checkout";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import AdminProdutos from "@/pages/admin/AdminProdutos";
import AdminCategorias from "@/pages/admin/AdminCategorias";
import AdminPedidos from "@/pages/admin/AdminPedidos";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminUpload from "@/pages/admin/AdminUpload";
import AdminPOS from "@/pages/admin/AdminPOS";
import Cliente from "@/pages/Cliente";
import AdminConfiguracoes from "@/pages/admin/AdminConfiguracoes";
import AdminPromocoes from "@/pages/admin/AdminPromocoes";
import NotFound from "@/pages/NotFound";
import { AdminLayout } from "@/components/AdminLayout";

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
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/cliente" element={<Cliente />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Admin />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="upload" element={<AdminUpload />} />
                <Route path="pos" element={<AdminPOS />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="promocoes" element={<AdminPromocoes />} />
              </Route>
              
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
