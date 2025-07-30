import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, MessageSquare, Edit, Brain, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RecentConversation {
  id: string;
  platform: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  timestamp: string;
  needs_correction?: boolean;
}

interface CorrectionFeedback {
  id: string;
  conversation_id?: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  user_feedback?: string;
  correction_provided?: string;
  is_correct?: boolean;
  learning_applied: boolean;
  created_at: string;
  updated_at: string;
}

export const CorrectionsTab: React.FC = () => {
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [corrections, setCorrections] = useState<CorrectionFeedback[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<RecentConversation | null>(null);
  const [isCorrectDialogOpen, setIsCorrectDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [correctionForm, setCorrectionForm] = useState({
    correct_response: '',
    correction_type: 'knowledge_base',
    add_to_knowledge: true,
    category: 'geral'
  });

  const categories = ['produtos', 'atendimento', 'entrega', 'pagamento', 'devolucao', 'geral'];
  const correctionTypes = [
    { value: 'knowledge_base', label: 'Adicionar à Base de Conhecimento' },
    { value: 'response_fix', label: 'Correção de Resposta' },
    { value: 'tone_adjustment', label: 'Ajuste de Tom' },
    { value: 'missing_info', label: 'Informação Faltante' }
  ];

  useEffect(() => {
    loadRecentConversations();
    loadCorrections();
  }, []);

  const loadRecentConversations = async () => {
    try {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (data) {
        // Agrupar por pares pergunta-resposta
        const conversations: RecentConversation[] = [];
        for (let i = 0; i < data.length - 1; i++) {
          const current = data[i];
          const next = data[i + 1];
          
          if (current.type === 'sent' && next.type === 'received' && 
              current.user_id === next.user_id && current.platform === next.platform) {
            conversations.push({
              id: `${next.id}-${current.id}`,
              platform: current.platform,
              user_id: current.user_id,
              user_message: next.message,
              ai_response: current.message,
              timestamp: current.timestamp
            });
          }
        }
        setRecentConversations(conversations);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas recentes');
    }
  };

  const loadCorrections = async () => {
    try {
      const { data } = await supabase
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setCorrections(data);
      }
    } catch (error) {
      console.error('Erro ao carregar correções:', error);
    }
  };

  const openCorrectionDialog = (conversation: RecentConversation) => {
    setSelectedConversation(conversation);
    setCorrectionForm({
      correct_response: '',
      correction_type: 'knowledge_base',
      add_to_knowledge: true,
      category: 'geral'
    });
    setIsCorrectDialogOpen(true);
  };

  const submitCorrection = async () => {
    if (!selectedConversation || !correctionForm.correct_response.trim()) {
      toast.error('Por favor, preencha a resposta correta');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe correção para esta pergunta/resposta
      const { data: existingCorrection } = await supabase
        .from('ai_feedback')
        .select('id')
        .eq('user_message', selectedConversation.user_message)
        .eq('ai_response', selectedConversation.ai_response)
        .single();

      if (existingCorrection) {
        toast.error('Esta conversa já foi corrigida anteriormente');
        setIsCorrectDialogOpen(false);
        return;
      }

      // 1. Salvar feedback de correção (SEMPRE aplicado automaticamente)
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: selectedConversation.user_id,
          user_message: selectedConversation.user_message,
          ai_response: selectedConversation.ai_response,
          correction_provided: correctionForm.correct_response,
          is_correct: false,
          learning_applied: true // Aplicado automaticamente
        })
        .select()
        .single();

      if (feedbackError) throw feedbackError;

      // 2. SEMPRE adicionar à base de conhecimento (não opcional)
      const { error: knowledgeError } = await supabase
        .from('ai_knowledge_base')
        .insert({
          category: correctionForm.category,
          question: selectedConversation.user_message,
          answer: correctionForm.correct_response,
          keywords: selectedConversation.user_message
            .toLowerCase()
            .split(' ')
            .filter(word => word.length > 2),
          priority: 3, // Alta prioridade para correções
          active: true
        });

      if (knowledgeError) throw knowledgeError;

      // 3. Criar insight de aprendizado
      const { error: insightError } = await supabase
        .from('ai_learning_insights')
        .insert({
          insight_type: 'response_correction',
          content: `Correção aplicada automaticamente: "${selectedConversation.user_message}" -> "${correctionForm.correct_response}"`,
          confidence_score: 0.9,
          usage_count: 1,
          effectiveness_score: 0.8,
          metadata: {
            original_response: selectedConversation.ai_response,
            corrected_response: correctionForm.correct_response,
            correction_type: correctionForm.correction_type,
            user_id: selectedConversation.user_id,
            auto_applied: true
          }
        });

      if (insightError) throw insightError;

      toast.success('Correção aplicada e adicionada à base de conhecimento automaticamente!');
      setIsCorrectDialogOpen(false);
      await loadCorrections();
      await loadRecentConversations();

    } catch (error) {
      console.error('Erro ao aplicar correção:', error);
      toast.error('Erro ao aplicar correção');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = recentConversations.filter(conv =>
    conv.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.ai_response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Recentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentConversations.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 50 interações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correções Aplicadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corrections.length}</div>
            <p className="text-xs text-muted-foreground">Melhorias implementadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentConversations.length > 0 ? 
                Math.round(((recentConversations.length - corrections.length) / recentConversations.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Respostas corretas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtrar Conversas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por pergunta ou resposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Lista de conversas recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversas Recentes para Revisão
          </CardTitle>
          <CardDescription>
            Revise as respostas da IA e corrija quando necessário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa recente.'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{conversation.platform}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {conversation.user_id.substring(0, 8)}...
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCorrectionDialog(conversation)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Corrigir
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">👤 Pergunta do Cliente:</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded">{conversation.user_message}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">🤖 Resposta da IA:</h4>
                        <p className="text-sm bg-green-50 p-3 rounded">{conversation.ai_response}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de correções aplicadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Correções Aplicadas Recentemente
          </CardTitle>
          <CardDescription>
            Histórico de melhorias implementadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {corrections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma correção aplicada ainda.
              </div>
            ) : (
              corrections.slice(0, 10).map((correction) => (
                <Card key={correction.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{correction.user_message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Corrigido em {new Date(correction.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                <Badge variant="secondary">
                  Aplicado Automaticamente
                </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de correção */}
      <Dialog open={isCorrectDialogOpen} onOpenChange={setIsCorrectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Corrigir Resposta da IA</DialogTitle>
            <DialogDescription>
              Forneça a resposta correta para melhorar o aprendizado da IA
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversation && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-blue-600">Pergunta do Cliente:</Label>
                  <div className="bg-blue-50 p-3 rounded mt-1">
                    {selectedConversation.user_message}
                  </div>
                </div>
                <div>
                  <Label className="text-red-600">Resposta Incorreta da IA:</Label>
                  <div className="bg-red-50 p-3 rounded mt-1">
                    {selectedConversation.ai_response}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Correção</Label>
                  <Select 
                    value={correctionForm.correction_type} 
                    onValueChange={(value) => setCorrectionForm(prev => ({...prev, correction_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {correctionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria (se adicionar à base)</Label>
                  <Select 
                    value={correctionForm.category} 
                    onValueChange={(value) => setCorrectionForm(prev => ({...prev, category: value}))}
                  >
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
              </div>

              <div className="space-y-2">
                <Label className="text-green-600">Resposta Correta:</Label>
                <Textarea
                  value={correctionForm.correct_response}
                  onChange={(e) => setCorrectionForm(prev => ({...prev, correct_response: e.target.value}))}
                  placeholder="Digite a resposta correta que a IA deveria ter dado..."
                  rows={4}
                  className="bg-green-50"
                />
              </div>

              <div className="flex items-center space-x-2 bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center text-green-700">
                  <span className="text-sm font-medium">
                    ✅ Esta correção será automaticamente adicionada à Base de Conhecimento
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCorrectDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={submitCorrection} disabled={loading}>
                  {loading ? 'Aplicando...' : 'Aplicar Correção'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};