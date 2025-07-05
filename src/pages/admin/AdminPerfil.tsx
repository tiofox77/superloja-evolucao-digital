import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Phone, Mail, Settings, Save, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import SuperLojaAvatar from '@/components/SuperLojaAvatar';

const AdminPerfil = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
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
          loadProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profileData) {
        setProfile(profileData);
        setProfileData({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          role: profileData.role || '',
          country: profileData.country || '',
          province: profileData.province || '',
          city: profileData.city || '',
          street: profileData.street || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          country: profileData.country,
          province: profileData.province,
          city: profileData.city,
          street: profileData.street
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      loadProfile(user?.id || '');
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            👤 Meu Perfil
          </h1>
          <p className="text-muted-foreground">Configure suas informações pessoais</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          👤 Meu Perfil
        </h1>
        <p className="text-muted-foreground">Configure suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="relative">
              <SuperLojaAvatar 
                src={profile?.avatar_url}
                alt="Avatar do administrador"
                size="xl"
                className="mx-auto"
                interactive
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile?.full_name || 'Nome não informado'}</h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
              {profile?.phone && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  +244{profile.phone}
                </p>
              )}
              <div className="mt-3">
                <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500">
                  {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>
            </div>
            
            {/* Account Stats */}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conta criada:</span>
                <span>{new Date(user?.created_at || '').toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último acesso:</span>
                <span>{new Date(user?.last_sign_in_at || '').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Editar Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="flex mt-1">
                    <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                      <span className="text-sm text-muted-foreground">+244</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '').replace(/^244/, '');
                        setProfileData({...profileData, phone: cleaned});
                      }}
                      placeholder="912345678"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite apenas os números sem o código do país
                  </p>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localização
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                      placeholder="Ex: Angola"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Província</Label>
                    <Input
                      id="province"
                      value={profileData.province}
                      onChange={(e) => setProfileData({...profileData, province: e.target.value})}
                      placeholder="Ex: Luanda"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      placeholder="Ex: Luanda"
                    />
                  </div>
                  <div>
                    <Label htmlFor="street">Rua/Bairro</Label>
                    <Input
                      id="street"
                      value={profileData.street}
                      onChange={(e) => setProfileData({...profileData, street: e.target.value})}
                      placeholder="Ex: Rua da Independência"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPerfil;