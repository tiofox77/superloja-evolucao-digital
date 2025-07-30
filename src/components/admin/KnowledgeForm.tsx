import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { type KnowledgeItem } from '@/utils/knowledgeBase';

interface KnowledgeFormProps {
  knowledge?: KnowledgeItem | null;
  onSave: (knowledge: Omit<KnowledgeItem, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function KnowledgeForm({ knowledge, onSave, onCancel }: KnowledgeFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    keywords: [] as string[],
    priority: 1,
    active: true
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (knowledge) {
      setFormData({
        category: knowledge.category,
        question: knowledge.question,
        answer: knowledge.answer,
        keywords: knowledge.keywords,
        priority: knowledge.priority,
        active: knowledge.active
      });
    }
  }, [knowledge]);

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {knowledge ? 'Editar Conhecimento' : 'Adicionar Conhecimento'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-lg"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="produtos">Produtos</option>
                  <option value="pedidos">Pedidos</option>
                  <option value="pagamento">Pagamento</option>
                  <option value="entrega">Entrega</option>
                  <option value="suporte">Suporte</option>
                  <option value="politicas">Políticas</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Pergunta/Tópico</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Ex: Como faço para trocar um produto?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Resposta</Label>
              <textarea
                id="answer"
                className="w-full p-2 border rounded-lg"
                rows={4}
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Ex: Para trocar um produto, você tem até 30 dias após a compra..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Palavras-chave</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Digite uma palavra-chave"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                />
                <Button type="button" onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Conhecimento Ativo</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (knowledge ? 'Atualizar' : 'Adicionar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}