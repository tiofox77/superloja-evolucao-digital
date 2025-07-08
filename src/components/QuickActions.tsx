import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Settings,
  PlusCircle,
  FileText,
  Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'POS - Ponto de Venda',
      description: 'Sistema de vendas diretas no balcão',
      icon: ShoppingCart,
      color: 'blue',
      path: '/admin/pos',
      priority: 'high'
    },
    {
      title: 'Gerenciar Produtos',
      description: 'Adicionar, editar produtos',
      icon: Package,
      color: 'green',
      path: '/admin/produtos',
      priority: 'high'
    },
    {
      title: 'Ver Pedidos',
      description: 'Todos os pedidos da loja',
      icon: ShoppingBag,
      color: 'orange',
      path: '/admin/pedidos',
      priority: 'high'
    },
    {
      title: 'Criar Produto',
      description: 'Adicionar novo produto',
      icon: PlusCircle,
      color: 'purple',
      path: '/admin/produtos?action=create',
      priority: 'medium'
    },
    {
      title: 'Relatórios',
      description: 'Analytics e relatórios',
      icon: BarChart3,
      color: 'indigo',
      path: '/admin/relatorios',
      priority: 'medium'
    },
    {
      title: 'Usuários',
      description: 'Gerenciar usuários',
      icon: Users,
      color: 'cyan',
      path: '/admin/usuarios',
      priority: 'medium'
    },
    {
      title: 'Promoções',
      description: 'Criar campanhas',
      icon: Megaphone,
      color: 'pink',
      path: '/admin/promocoes',
      priority: 'low'
    },
    {
      title: 'Configurações',
      description: 'Configurar loja',
      icon: Settings,
      color: 'gray',
      path: '/admin/configuracoes',
      priority: 'low'
    },
    {
      title: 'Páginas Estáticas',
      description: 'Gerenciar conteúdo',
      icon: FileText,
      color: 'teal',
      path: '/admin/paginas-estaticas',
      priority: 'low'
    }
  ];

  const getColorClasses = (color: string, priority: string) => {
    const baseClasses = {
      blue: 'border-l-blue-500 hover:shadow-blue-100',
      green: 'border-l-green-500 hover:shadow-green-100',
      orange: 'border-l-orange-500 hover:shadow-orange-100',
      purple: 'border-l-purple-500 hover:shadow-purple-100',
      indigo: 'border-l-indigo-500 hover:shadow-indigo-100',
      cyan: 'border-l-cyan-500 hover:shadow-cyan-100',
      pink: 'border-l-pink-500 hover:shadow-pink-100',
      gray: 'border-l-gray-500 hover:shadow-gray-100',
      teal: 'border-l-teal-500 hover:shadow-teal-100'
    };

    const buttonClasses = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      green: 'bg-green-600 hover:bg-green-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      cyan: 'bg-cyan-600 hover:bg-cyan-700',
      pink: 'bg-pink-600 hover:bg-pink-700',
      gray: 'bg-gray-600 hover:bg-gray-700',
      teal: 'bg-teal-600 hover:bg-teal-700'
    };

    const iconClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600',
      cyan: 'text-cyan-600',
      pink: 'text-pink-600',
      gray: 'text-gray-600',
      teal: 'text-teal-600'
    };

    return {
      card: baseClasses[color] || baseClasses.gray,
      button: buttonClasses[color] || buttonClasses.gray,
      icon: iconClasses[color] || iconClasses.gray
    };
  };

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedActions = actions.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Ações Rápidas</h2>
        <p className="text-muted-foreground text-sm">
          Acesso direto às funcionalidades mais utilizadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedActions.map((action, index) => {
          const IconComponent = action.icon;
          const colorClasses = getColorClasses(action.color, action.priority);
          
          return (
            <Card 
              key={index}
              className={`
                hover-scale hover:shadow-lg transition-all duration-300 cursor-pointer 
                border-l-4 ${colorClasses.card}
                ${action.priority === 'high' ? 'ring-1 ring-primary/20' : ''}
              `}
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-sm ${colorClasses.icon}`}>
                  <IconComponent className="h-4 w-4" />
                  {action.title}
                  {action.priority === 'high' && (
                    <span className="ml-auto">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-xs mb-3">
                  {action.description}
                </p>
                <Button 
                  size="sm" 
                  className={`${colorClasses.button} text-white text-xs h-7`}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;