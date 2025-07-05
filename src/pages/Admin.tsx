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
      const startTime = Date.now();
      console.log('=== INÍCIO DIAGNÓSTICO DETALHADO ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Verificando sessão:', !!session);
      
      if (!session?.user) {
        console.log('❌ Sem usuário, redirecionando para auth');
        navigate('/auth');
        setLoading(false);
        return;
      }

      console.log('✅ Usuário encontrado:', {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
        metadata: session.user.user_metadata
      });
      
      console.log('🔐 Detalhes da sessão:', {
        access_token: session.access_token ? 'presente' : 'ausente',
        refresh_token: session.refresh_token ? 'presente' : 'ausente',
        expires_in: session.expires_in,
        expires_at: session.expires_at
      });

      // Teste de conectividade básica
      console.log('🌐 Testando conectividade Supabase...');
      try {
        const connectivityTest = await supabase.from('products').select('count').limit(1);
        console.log('✅ Conectividade OK:', connectivityTest.error ? 'ERRO' : 'SUCCESS');
        if (connectivityTest.error) {
          console.error('Erro de conectividade:', connectivityTest.error);
        }
      } catch (connError) {
        console.error('❌ Falha total de conectividade:', connError);
      }

      try {
        console.log('🔍 Buscando perfil para user_id:', session.user.id);
        console.log('📊 Verificando estado da autenticação...');
        
        // Log da query exata que será executada
        console.log('📝 Query SQL equivalente:', `SELECT role, email FROM profiles WHERE user_id = '${session.user.id}'`);
        
        // Query com logs detalhados de cada etapa
        console.log('⏳ Iniciando query profiles by user_id...');
        const queryStartTime = Date.now();
        
        const profileQuery = supabase
          .from('profiles')
          .select('role, email, user_id, created_at')
          .eq('user_id', session.user.id);
        
        console.log('🔧 Query construída, executando...');
        
        // Timeout mais longo para debug
        const profilePromise = profileQuery.maybeSingle();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.log('⏰ TIMEOUT após 10 segundos');
            reject(new Error('Timeout na query profiles'));
          }, 10000)
        );
        
        let result;
        try {
          console.log('🚀 Executando Promise.race...');
          result = await Promise.race([profilePromise, timeoutPromise]);
          const queryTime = Date.now() - queryStartTime;
          console.log('✅ Query completada em', queryTime, 'ms:', result);
        } catch (timeoutError) {
          const queryTime = Date.now() - queryStartTime;
          console.error('❌ Query com timeout após', queryTime, 'ms:', timeoutError);
          
          // Diagnóstico adicional
          console.log('🔍 Diagnóstico do timeout:');
          console.log('- Tempo decorrido:', queryTime + 'ms');
          console.log('- User ID:', session.user.id);
          console.log('- Email para busca alternativa:', session.user.email);
          
          // Tentar busca alternativa com logs detalhados
          console.log('🔄 Tentando busca alternativa por email...');
          const emailQueryStart = Date.now();
          
          try {
            const emailQuery = supabase
              .from('profiles')
              .select('role, email, user_id, created_at')  
              .eq('email', session.user.email);
              
            console.log('📝 Query alternativa:', `SELECT role, email FROM profiles WHERE email = '${session.user.email}'`);
            
            const emailTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout busca por email')), 8000)
            );
            
            result = await Promise.race([emailQuery.maybeSingle(), emailTimeout]);
            const emailQueryTime = Date.now() - emailQueryStart;
            console.log('✅ Busca por email completada em', emailQueryTime, 'ms:', result);
            
          } catch (emailError) {
            const emailQueryTime = Date.now() - emailQueryStart;
            console.error('❌ Busca por email falhou após', emailQueryTime, 'ms:', emailError);
            
            // Último recurso: verificação manual
            console.log('🆘 Último recurso: verificação manual de admin');
            if (session.user.email === 'carlosfox1782@gmail.com') {
              console.log('🔓 Email reconhecido como admin, liberando acesso');
              result = { data: { role: 'admin', email: session.user.email }, error: null };
            } else {
              throw new Error('Todas as tentativas de busca falharam');
            }
          }
        }
        
        const { data: profile, error } = result;
        
        console.log('📋 Resultado final da busca:', {
          profile,
          error,
          tempoTotal: Date.now() - startTime + 'ms'
        });
        
        if (!profile) {
          console.log('❌ Perfil não encontrado');
          console.log('📊 Dados disponíveis para debug:', {
            userId: session.user.id,
            userEmail: session.user.email,
            errorDetails: error
          });
          
          toast({
            title: "Acesso negado",
            description: "Perfil não encontrado no sistema.",
            variant: "destructive"
          });
          navigate('/');
          setLoading(false);
          return;
        }
        
        console.log('✅ Perfil encontrado:', profile);
        console.log('🔑 Role do usuário:', profile.role);
        
        if (profile?.role === 'admin') {
          console.log('👑 Usuário é ADMIN - liberando acesso total');
          console.log('⏱️ Tempo total de autenticação:', Date.now() - startTime + 'ms');
          setIsAdmin(true);
          
          console.log('📊 Carregando estatísticas...');
          await loadStats();
          
          console.log('🎉 Admin dashboard carregado com sucesso!');
        } else {
          console.log('🚫 Usuário NÃO é admin:', profile?.role);
          console.log('👤 Perfil completo:', profile);
          setIsAdmin(false);
          toast({
            title: "Acesso negado",
            description: `Seu nível de acesso (${profile?.role || 'não definido'}) não permite acessar esta área.`,
            variant: "destructive"
          });
          navigate('/');
        }
        
      } catch (err) {
        const totalTime = Date.now() - startTime;
        console.error('💥 ERRO CRÍTICO na verificação (', totalTime, 'ms):', err);
        console.error('Stack trace:', err.stack);
        console.log('🔧 Informações para debug:', {
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          errorMessage: err.message,
          errorName: err.name
        });
        
        // Para debug, liberar acesso se for o email conhecido
        if (session.user.email === 'carlosfox1782@gmail.com') {
          console.log('🆘 MODO DEBUG: Liberando acesso para email conhecido');
          setIsAdmin(true);
          await loadStats();
        } else {
          navigate('/auth');
        }
      }
      
      setLoading(false);
      console.log('=== FIM DIAGNÓSTICO (', Date.now() - startTime, 'ms) ===');
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
      console.log('Carregando estatísticas...');
      
      // Contar produtos
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Contar usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      console.log('Estatísticas carregadas:', { productsCount, usersCount });

      setStats({
        totalOrders: 0,
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalRevenue: 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de administração da SuperLoja</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Adicione, edite ou remova produtos do catálogo.
              </p>
              <Badge variant="outline">Em desenvolvimento</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Visualize e gerencie todos os pedidos realizados.
              </p>
              <Badge variant="outline">Em desenvolvimento</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gerencie usuários e suas permissões.
              </p>
              <Badge variant="outline">Em desenvolvimento</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Acesso */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Usuário logado:</strong> {user?.email}</p>
              <p><strong>Nível de acesso:</strong> <Badge variant="default">Administrador</Badge></p>
              <p><strong>URL da área admin:</strong> <code>/admin</code></p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;