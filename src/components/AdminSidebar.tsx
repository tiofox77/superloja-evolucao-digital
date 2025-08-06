import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FolderOpen, 
  BarChart3, 
  TrendingUp,
  Settings,
  Tag,
  Upload,
  FileText,
  Activity,
  User,
  Layout,
  Smartphone,
  Gavel,
  Image,
  BookOpen,
  FileDown,
  Bot,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'POS - Vendas',
    url: '/admin/pos',
    icon: ShoppingCart,
  },
  {
    title: 'Produtos',
    url: '/admin/produtos',
    icon: Package,
  },
  {
    title: 'Catálogo PDF',
    url: '/admin/catalogo-produtos',
    icon: FileDown,
  },
  {
    title: 'Categorias',
    url: '/admin/categorias',
    icon: FolderOpen,
  },
  {
    title: 'Pedidos',
    url: '/admin/pedidos',
    icon: ShoppingCart,
  },
  {
    title: 'Usuários',
    url: '/admin/usuarios',
    icon: Users,
  },
  {
    title: 'Relatórios',
    url: '/admin/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Relatórios Produtos',
    url: '/admin/relatorios-produtos',
    icon: Package,
  },
  {
    title: 'Leilões',
    url: '/admin/leiloes',
    icon: Gavel,
  },
  {
    title: 'Solicitações',
    url: '/admin/solicitacoes',
    icon: FileText,
  },
  {
    title: 'Agente IA',
    url: '/admin/agente-ia',
    icon: Bot,
  },
  {
    title: 'Auto Post IA',
    url: '/admin/auto-post-ia',
    icon: Sparkles,
  },
];

const toolsItems = [
  {
    title: 'Meu Perfil',
    url: '/admin/perfil',
    icon: User,
  },
  {
    title: 'Editor de Layout',
    url: '/admin/layout',
    icon: Layout,
  },
  {
    title: 'PWA',
    url: '/admin/pwa',
    icon: Smartphone,
  },
  {
    title: 'Upload de Imagens',
    url: '/admin/upload',
    icon: Upload,
  },
  {
    title: 'Gerador de Banners',
    url: '/admin/banner-gerador',
    icon: Image,
  },
  {
    title: 'Promoções',
    url: '/admin/promocoes',
    icon: Tag,
  },
  {
    title: 'Logs',
    url: '/admin/logs',
    icon: Activity,
  },
  {
    title: 'Meta/Facebook',
    url: '/admin/meta',
    icon: Settings,
  },
  {
    title: 'Páginas Estáticas',
    url: '/admin/paginas-estaticas',
    icon: FileText,
  },
  {
    title: 'Coordenadas Bancárias',
    url: '/admin/coordenadas-bancarias',
    icon: CreditCard,
  },
  {
    title: 'Configurações',
    url: '/admin/configuracoes',
    icon: Settings,
  },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) =>
    isActive(path) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";

  return (
    <Sidebar className="w-64">
      <SidebarContent>
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">SuperLoja</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};