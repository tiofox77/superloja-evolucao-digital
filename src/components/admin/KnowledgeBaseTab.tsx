import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
  created_at: string;
}

interface KnowledgeBaseTabProps {
  knowledgeBase: KnowledgeItem[];
  onReload: () => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  knowledgeBase,
  onReload
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: 'produtos',
    question: '',
    answer: '',
    keywords: '',
    priority: 2
  });

  const categories = ['produtos', 'atendimento', 'entrega', 'pagamento', 'devolucao', 'geral'];

  const resetForm = () => {
    setFormData({
      category: 'produtos',
      question: '',
      answer: '',
      keywords: '',
      priority: 2
    });
  };

  const handleAdd = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Pergunta e resposta são obrigatórias!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: formData.category,
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          priority: formData.priority,
          active: true
        })
        .select();

      if (error) throw error;

      toast.success('Conhecimento adicionado com sucesso!');
      setIsAddDialogOpen(false);
      resetForm();
      onReload();
    } catch (error) {
      console.error('Erro ao adicionar conhecimento:', error);
      toast.error('Erro ao adicionar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({
          category: formData.category,
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          priority: formData.priority
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Conhecimento atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      onReload();
    } catch (error) {
      console.error('Erro ao atualizar conhecimento:', error);
      toast.error('Erro ao atualizar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conhecimento?')) return;

    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Conhecimento excluído com sucesso!');
      onReload();
    } catch (error) {
      console.error('Erro ao excluir conhecimento:', error);
      toast.error('Erro ao excluir conhecimento');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Conhecimento ${!active ? 'ativado' : 'desativado'} com sucesso!`);
      onReload();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      question: item.question,
      answer: item.answer,
      keywords: item.keywords.join(', '),
      priority: item.priority
    });
    setIsEditDialogOpen(true);
  };

  const filteredKnowledge = knowledgeBase.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          🧠 Base de Conhecimento
        </CardTitle>
        <CardDescription>
          Gerencie o conhecimento do agente IA sobre produtos, atendimento e processos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Controles */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conhecimentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Conhecimento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Conhecimento</DialogTitle>
                  <DialogDescription>
                    Adicione um novo conhecimento para o agente IA
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({...prev, priority: parseInt(value)}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Baixa</SelectItem>
                          <SelectItem value="2">2 - Média</SelectItem>
                          <SelectItem value="3">3 - Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pergunta/Tópico</Label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData(prev => ({...prev, question: e.target.value}))}
                      placeholder="Ex: Como funciona a entrega?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Resposta</Label>
                    <Textarea
                      value={formData.answer}
                      onChange={(e) => setFormData(prev => ({...prev, answer: e.target.value}))}
                      placeholder="Resposta detalhada..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <Input
                      value={formData.keywords}
                      onChange={(e) => setFormData(prev => ({...prev, keywords: e.target.value}))}
                      placeholder="entrega, frete, envio (separadas por vírgula)"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAdd} disabled={loading}>
                      {loading ? 'Salvando...' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Conhecimentos */}
          <div className="space-y-4">
            {filteredKnowledge.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterCategory !== 'all' ? 
                  'Nenhum conhecimento encontrado com os filtros aplicados.' :
                  'Nenhum conhecimento cadastrado ainda.'
                }
              </div>
            ) : (
              filteredKnowledge.map((item) => (
                <Card key={item.id} className={`p-4 ${!item.active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant={item.priority === 3 ? 'destructive' : item.priority === 2 ? 'default' : 'secondary'}>
                          Prioridade {item.priority}
                        </Badge>
                        <Badge variant={item.active ? 'default' : 'secondary'}>
                          {item.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{item.question}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.answer}</p>
                      {item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item.id, item.active)}
                      >
                        {item.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Dialog de Edição */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Conhecimento</DialogTitle>
                <DialogDescription>
                  Edite as informações do conhecimento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({...prev, priority: parseInt(value)}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Baixa</SelectItem>
                        <SelectItem value="2">2 - Média</SelectItem>
                        <SelectItem value="3">3 - Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pergunta/Tópico</Label>
                  <Input
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({...prev, question: e.target.value}))}
                    placeholder="Ex: Como funciona a entrega?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resposta</Label>
                  <Textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({...prev, answer: e.target.value}))}
                    placeholder="Resposta detalhada..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Palavras-chave</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({...prev, keywords: e.target.value}))}
                    placeholder="entrega, frete, envio (separadas por vírgula)"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleEdit} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};