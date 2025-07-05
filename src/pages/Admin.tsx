import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { ShoppingBag, Users, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    console.log('Admin useEffect iniciado');
    
    const checkAuthAndRole = async (session: any) => {
      if (!session?.user) {
        navigate('/auth');
        setLoading(false);
        return;
      }

      // Acesso direto para admin conhecido
      if (session.user.email === 'carlosfox1782@gmail.com') {
        console.log('Admin access granted');
        setIsAdmin(true);
        setLoading(false); // CRÍTICO: definir loading false ANTES de loadStats
        
        // Carregar stats sem bloquear
        setTimeout(async () => {
          try {
            await loadStats();
            console.log('Stats loaded');
          } catch (err) {
            console.log('Stats error:', err);
          }
        }, 100);
        
        return;
      }

      // Para outros usuários
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
      } catch {
        navigate('/auth');
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        await checkAuthAndRole(session);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Sessão inicial obtida:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      await checkAuthAndRole(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const loadStats = async () => {
    try {
      const [productsResult, usersResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalOrders: 0,
        totalUsers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalRevenue: 0
      });
    } catch (error) {
      console.error('Stats error:', error);
      setStats({ totalOrders: 0, totalUsers: 0, totalProducts: 0, totalRevenue: 0 });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua loja online</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <Badge variant="secondary" className="mt-2">Em breve</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-2">Usuários registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-2">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <Badge variant="secondary" className="mt-2">Em breve</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciar Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Adicione, edite ou remova produtos do catálogo.
            </p>
            <Button>Ir para Produtos</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize e gerencie todos os pedidos realizados.
            </p>
            <Button variant="outline">Ver Pedidos</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie usuários e suas permissões.
            </p>
            <Button variant="outline">Gerenciar Usuários</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;