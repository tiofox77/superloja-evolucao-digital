import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { useNotifications } from '@/hooks/useNotifications';

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createWelcomeNotification } = useNotifications();

  const [loginData, setLoginData] = useState({
    identifier: '', // email, phone ou username
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    country: '',
    province: '',
    city: '',
    street: ''
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determinar se é email ou telefone
      const isEmail = loginData.identifier.includes('@');
      const isPhone = /^\+?[\d\s-()]+$/.test(loginData.identifier);

      let { error } = { error: null as any };
      
      if (isEmail) {
        ({ error } = await supabase.auth.signInWithPassword({
          email: loginData.identifier,
          password: loginData.password
        }));
      } else if (isPhone) {
        ({ error } = await supabase.auth.signInWithPassword({
          phone: loginData.identifier,
          password: loginData.password
        }));
      } else {
        // Para username, precisamos buscar o email primeiro
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('full_name', loginData.identifier)
          .single();
        
        if (!profile?.email) {
          throw new Error('Usuário não encontrado');
        }
        
        ({ error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: loginData.password
        }));
      }

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!"
      });

    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupData.fullName,
            phone: signupData.phone,
            country: signupData.country,
            province: signupData.province,
            city: signupData.city,
            street: signupData.street
          }
        }
      });

      if (error) throw error;

      // Enviar notificação de boas-vindas
      try {
        await createWelcomeNotification(
          signupData.email, 
          signupData.fullName,
          signupData.phone ? `+244${signupData.phone}` : undefined,
          window.location.hostname !== 'localhost' // Força envio real em produção
        );
      } catch (notificationError) {
        console.error('Erro ao enviar notificação de boas-vindas:', notificationError);
        // Não falhar se não conseguir enviar notificação
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta."
      });

    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Usuário já logado, vai ser redirecionado
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="identifier">Email, Telefone ou Nome</Label>
                      <Input
                        id="identifier"
                        type="text"
                        value={loginData.identifier}
                        onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                        placeholder="Digite seu email, telefone ou nome"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                          <span className="text-sm text-muted-foreground">+244</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          value={signupData.phone}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '').replace(/^244/, '');
                            setSignupData({...signupData, phone: cleaned});
                          }}
                          placeholder="912345678"
                          className="rounded-l-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Digite apenas os números sem o código do país
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={signupData.country || ''}
                        onChange={(e) => setSignupData({...signupData, country: e.target.value})}
                        placeholder="Ex: Angola"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Província</Label>
                      <Input
                        id="province"
                        value={signupData.province || ''}
                        onChange={(e) => setSignupData({...signupData, province: e.target.value})}
                        placeholder="Ex: Luanda"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={signupData.city || ''}
                        onChange={(e) => setSignupData({...signupData, city: e.target.value})}
                        placeholder="Ex: Luanda"
                      />
                    </div>
                    <div>
                      <Label htmlFor="street">Endereço (opcional)</Label>
                      <Input
                        id="street"
                        value={signupData.street || ''}
                        onChange={(e) => setSignupData({...signupData, street: e.target.value})}
                        placeholder="Rua, bairro, número (opcional para entrega)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signupPassword">Senha</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;