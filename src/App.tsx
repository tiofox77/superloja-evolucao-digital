import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MobileNavbar } from "@/components/MobileNavbar";
import Index from "@/pages/Index";
import Catalogo from "@/pages/Catalogo";
import Produto from "@/pages/Produto";
import Categorias from "@/pages/Categorias";
import Sobre from "@/pages/Sobre";
import Checkout from "@/pages/Checkout";
import Cliente from "@/pages/Cliente";
import Fatura from "@/pages/Fatura";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import AdminProdutos from "@/pages/admin/AdminProdutos";
import AdminCategorias from "@/pages/admin/AdminCategorias";
import AdminPedidos from "@/pages/admin/AdminPedidos";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminUpload from "@/pages/admin/AdminUpload";
import AdminPOS from "@/pages/admin/AdminPOS";
import AdminConfiguracoes from "@/pages/admin/AdminConfiguracoes";
import AdminPromocoes from "@/pages/admin/AdminPromocoes";
import AdminPerfil from "@/pages/admin/AdminPerfil";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminRelatorios from "@/pages/admin/AdminRelatorios";
import AdminRelatoriosProdutos from "@/pages/admin/AdminRelatoriosProdutos";
import AdminLayoutEditor from "@/pages/admin/AdminLayoutEditor";
import AdminPWA from "@/pages/admin/AdminPWA";
import AdminMeta from "@/pages/admin/AdminMeta";
import AdminLeiloes from "@/pages/admin/AdminLeiloes";
import AdminCriarLeilao from "@/pages/admin/AdminCriarLeilao";
import AdminLeiloesBids from "@/pages/admin/AdminLeiloesBids";
import AdminSolicitacoes from "@/pages/admin/AdminSolicitacoes";
import AdminPaginasEstaticas from "@/pages/admin/AdminPaginasEstaticas";
import AdminBannerGerador from "@/pages/admin/AdminBannerGerador";
import AdminCatalogoProdutos from "@/pages/admin/AdminCatalogoProdutos";
import { AdminAnalytics } from "@/pages/admin/AdminAnalytics";
import AdminAgentIA from "@/pages/admin/AdminAgentIA";
import { CatalogPage } from "@/pages/CatalogPage";
import SolicitarProduto from "@/pages/SolicitarProduto";
import Contato from "@/pages/Contato";
import FAQ from "@/pages/FAQ";
import TermosUso from "@/pages/TermosUso";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import PoliticaDevolucao from "@/pages/PoliticaDevolucao";
import Leiloes from "@/pages/Leiloes";
import LeilaoDetalhes from "@/pages/LeilaoDetalhes";
import SaudeBemEstar from "@/pages/SaudeBemEstar";
import NotFound from "@/pages/NotFound";
import { AdminLayout } from "@/components/AdminLayout";
import { HelmetProvider } from 'react-helmet-async';
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SEOHead } from "@/components/SEOHead";

function App() {
  return (
    <HelmetProvider>
      <SettingsProvider>
        <LayoutProvider>
          <CartProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-background pb-16 md:pb-0">
            <SEOHead />
            <AnalyticsTracker />
            <PWAInstallPrompt />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/produto/:slug" element={<Produto />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/saude-bem-estar" element={<SaudeBemEstar />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/termos-uso" element={<TermosUso />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/politica-devolucao" element={<PoliticaDevolucao />} />
              <Route path="/solicitar-produto" element={<SolicitarProduto />} />
              <Route path="/leiloes" element={<Leiloes />} />
              <Route path="/leilao/:slug" element={<LeilaoDetalhes />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/cliente" element={<Cliente />} />
              <Route path="/fatura/:orderId" element={<Fatura />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Admin />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="pedidos" element={<AdminPedidos />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="perfil" element={<AdminPerfil />} />
                <Route path="upload" element={<AdminUpload />} />
                <Route path="pos" element={<AdminPOS />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="promocoes" element={<AdminPromocoes />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
                <Route path="relatorios-produtos" element={<AdminRelatoriosProdutos />} />
                <Route path="layout" element={<AdminLayoutEditor />} />
                <Route path="pwa" element={<AdminPWA />} />
                <Route path="meta" element={<AdminMeta />} />
                <Route path="leiloes" element={<AdminLeiloes />} />
                <Route path="leiloes-bids" element={<AdminLeiloesBids />} />
                <Route path="criar-leilao" element={<AdminCriarLeilao />} />
                <Route path="solicitacoes" element={<AdminSolicitacoes />} />
                <Route path="paginas-estaticas" element={<AdminPaginasEstaticas />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="banner-gerador" element={<AdminBannerGerador />} />
                <Route path="catalogo-produtos" element={<AdminCatalogoProdutos />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="catalogo-gerado" element={<CatalogPage />} />
                <Route path="agente-ia" element={<AdminAgentIA />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <MobileNavbar />
          </div>
          <Toaster />
        </Router>
      </CartProvider>
      </LayoutProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}

export default App;
