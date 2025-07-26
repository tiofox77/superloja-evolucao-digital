import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaticPage {
  id: string;
  page_key: string;
  title: string;
  content: string;
  meta_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPaginasEstaticas = () => {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<StaticPage>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('page_key');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar páginas estáticas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (page: StaticPage) => {
    setEditingPage(page.id);
    setFormData(page);
  };

  const cancelEditing = () => {
    setEditingPage(null);
    setFormData({});
  };

  const savePage = async () => {
    if (!editingPage || !formData) return;

    try {
      const { error } = await supabase
        .from('static_pages')
        .update({
          title: formData.title,
          content: formData.content,
          meta_description: formData.meta_description,
          is_active: formData.is_active
        })
        .eq('id', editingPage);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Página atualizada com sucesso!"
      });

      setEditingPage(null);
      setFormData({});
      loadPages();
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar página.",
        variant: "destructive"
      });
    }
  };

  const getPageDisplayName = (pageKey: string) => {
    const names: Record<string, string> = {
      'about': 'Sobre Nós',
      'contact': 'Contato',
      'faq': 'FAQ',
      'terms': 'Termos de Uso',
      'privacy': 'Política de Privacidade',
      'returns': 'Política de Devolução'
    };
    return names[pageKey] || pageKey;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Páginas Estáticas</h1>
        <p className="text-muted-foreground">Gerencie o conteúdo das páginas do site</p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Lista de Páginas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-6">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>{getPageDisplayName(page.page_key)}</span>
                      <Badge variant={page.is_active ? "default" : "secondary"}>
                        {page.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPage === page.id ? (
                        <>
                          <Button size="sm" onClick={savePage}>
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEditing(page)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPage === page.id ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                          value={formData.title || ''}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Meta Descrição</label>
                        <Input
                          value={formData.meta_description || ''}
                          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                          placeholder="Descrição para SEO"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Conteúdo</label>
                        <Textarea
                          value={formData.content || ''}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={8}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.is_active || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <label className="text-sm font-medium">Página ativa</label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-medium mb-1">{page.title}</h3>
                        {page.meta_description && (
                          <p className="text-sm text-muted-foreground mb-2">{page.meta_description}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-3">{page.content}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Última atualização: {new Date(page.updated_at).toLocaleString('pt-BR')}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaginasEstaticas;