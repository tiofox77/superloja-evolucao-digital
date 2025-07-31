import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  Save, 
  MessageSquare,
  Brain,
  Target,
  Lightbulb,
  Search,
  Globe,
  Loader2,
  CheckCircle,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TrainingExample {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isSearchResult?: boolean;
  relatedQuestions?: string[];
  searchQuery?: string;
  confidence?: number;
}

const TrainingChat = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [newExample, setNewExample] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: 'geral'
  });
  const [isTraining, setIsTraining] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'examples'>('chat');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Carregar exemplos de treinamento
  const loadTrainingExamples = async () => {
    try {
      const { data } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setTrainingExamples(data.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          keywords: item.keywords || [],
          category: item.category,
          created_at: item.created_at
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar exemplos:', error);
    }
  };

  useEffect(() => {
    loadTrainingExamples();
  }, []);

  // Buscar informações na internet
  const searchWeb = async (query: string, context: string = '') => {
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-search-web', {
        body: {
          query,
          context,
          language: 'pt'
        }
      });

      if (error) throw error;

      if (data?.success) {
        return {
          content: data.result,
          relatedQuestions: data.related_questions || [],
          searchQuery: query,
          confidence: 0.8
        };
      } else {
        throw new Error(data?.error || 'Erro na pesquisa');
      }
    } catch (error) {
      console.error('Erro na pesquisa web:', error);
      toast.error('Erro ao pesquisar na internet. Tentando resposta local...');
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  // Verificar se deve pesquisar na internet
  const shouldSearchWeb = (message: string): boolean => {
    const searchTriggers = [
      'não sei', 'não tenho informação', 'não encontrei', 
      'não conheço', 'buscar', 'pesquisar', 'procurar',
      'tws pro6', 'airpods', 'iphone', 'smartphone', 'preço'
    ];
    
    return searchTriggers.some(trigger => 
      message.toLowerCase().includes(trigger.toLowerCase())
    );
  };

  // Verificar se precisa escalação para admin
  const needsEscalation = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    // Casos que precisam escalação para admin
    if (lowerMessage.includes('reclamação') || lowerMessage.includes('problema técnico')) {
      return 'reclamacao_tecnica';
    }
    if (lowerMessage.includes('orçamento província') || lowerMessage.includes('entrega província')) {
      return 'orcamento_provincia';
    }
    if (lowerMessage.includes('preço especial') || lowerMessage.includes('desconto especial')) {
      return 'preco_especial';
    }
    if (lowerMessage.includes('produto específico') && !lowerMessage.includes('iphone') && !lowerMessage.includes('airpods') && !lowerMessage.includes('samsung')) {
      return 'produto_especifico';
    }
    
    return null;
  };

  // Gerar resposta local inteligente
  const generateLocalResponse = async (message: string, context: ChatMessage[]): Promise<string> => {
    // Verificar se precisa escalação
    const escalationReason = needsEscalation(message);
    if (escalationReason) {
      return "Para essa informação específica, vou conectar você com nosso especialista. Um momento por favor... ⏳\n\n[USUÁRIO ESCALADO PARA ADMIN - AGUARDANDO INTERVENÇÃO]";
    }

    // Buscar na base de conhecimento
    const { data: knowledgeItems } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('active', true);

    if (knowledgeItems) {
      // Procurar resposta relevante
      const relevantItem = knowledgeItems.find(item => 
        item.keywords.some((keyword: string) => 
          message.toLowerCase().includes(keyword.toLowerCase())
        ) || message.toLowerCase().includes(item.question.toLowerCase().substring(0, 10))
      );

      if (relevantItem) {
        return relevantItem.answer;
      }
    }

    // Resposta contextual baseada na mensagem com informações da loja
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('whatsapp') || lowerMessage.includes('contacto') || lowerMessage.includes('contato')) {
      return `Nosso WhatsApp é 939729902. Link direto: https://wa.me/244939729902. Estamos localizados no Kilamba J13, Luanda.`;
    }
    
    if (lowerMessage.includes('localização') || lowerMessage.includes('onde fica') || lowerMessage.includes('endereço')) {
      return `Nossa loja fica no Kilamba J13, Luanda. Para produtos urgentes, pode recolher diretamente na loja. WhatsApp: 939729902`;
    }
    
    if (lowerMessage.includes('entrega')) {
      return `Entrega GRÁTIS em Luanda! Para outras províncias, fazemos orçamento personalizado. Contacte 939729902 para mais detalhes.`;
    }
    
    if (lowerMessage.includes('preço') || lowerMessage.includes('custa') || lowerMessage.includes('valor')) {
      return `Para informações de preços atualizados, recomendo contactar nossa loja pelo WhatsApp 939729902 ou visitar no Kilamba J13. Os preços variam conforme promoções ativas.`;
    }
    
    if (lowerMessage.includes('disponível') || lowerMessage.includes('stock') || lowerMessage.includes('tem')) {
      return `Para confirmar disponibilidade atual, contacte-nos pelo WhatsApp 939729902. Nossa loja fica no Kilamba J13, Luanda.`;
    }
    
    if (lowerMessage.includes('airpods') || lowerMessage.includes('fones')) {
      return `Temos AirPods originais e também os populares TWS Pro6 com excelente qualidade. Para preços e disponibilidade atual, contacte 939729902 (Kilamba J13).`;
    }
    
    if (lowerMessage.includes('iphone') || lowerMessage.includes('samsung') || lowerMessage.includes('smartphone')) {
      return `Temos diversos modelos de smartphones iPhone e Samsung. Para informações específicas de modelos e preços, contacte 939729902 ou visite-nos no Kilamba J13.`;
    }
    
    if (lowerMessage.includes('garantia') || lowerMessage.includes('assistência')) {
      return `Todos nossos produtos têm garantia oficial com assistência técnica local. Para detalhes específicos da garantia, contacte 939729902.`;
    }

    if (shouldSearchWeb(message)) {
      return `Entendi sua pergunta sobre "${message}". Deixe-me pesquisar informações atualizadas na internet para dar uma resposta mais precisa.`;
    }
    
    // Resposta genérica melhorada com informações da loja
    return `Olá! Sou assistente da Superloja Evolução Digital, no Kilamba J13, Luanda. Para mais informações específicas sobre "${message}", contacte nosso WhatsApp 939729902. Posso ajudar com informações gerais ou fazer uma pesquisa web detalhada. O que prefere?`;
  };
  // Enviar mensagem para a IA
  const sendTrainingMessage = async (message: string, forceWebSearch: boolean = false) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTraining(true);

    try {
      let botResponse: ChatMessage;
      
      // Determinar se deve pesquisar na web
      const needsWebSearch = forceWebSearch || shouldSearchWeb(message);
      
      if (needsWebSearch) {
        // Tentar pesquisar na web primeiro
        const contextString = chatMessages.slice(-5).map(msg => 
          `${msg.role}: ${msg.content}`
        ).join('\n');
        
        const webResult = await searchWeb(message, contextString);
        
        if (webResult) {
          botResponse = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: webResult.content,
            timestamp: new Date().toISOString(),
            isSearchResult: true,
            relatedQuestions: webResult.relatedQuestions,
            searchQuery: webResult.searchQuery,
            confidence: webResult.confidence
          };
        } else {
          // Fallback para resposta local
          const localResponse = await generateLocalResponse(message, chatMessages);
          botResponse = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: localResponse,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // Resposta local
        const localResponse = await generateLocalResponse(message, chatMessages);
        botResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse,
          timestamp: new Date().toISOString()
        };
      }

      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao comunicar com a IA');
    } finally {
      setIsTraining(false);
    }
  };

  // Copiar mensagem para clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar texto');
    }
  };

  // Adicionar resposta como exemplo de treinamento
  const addResponseAsExample = (userMsg: string, aiResponse: string) => {
    setNewExample({
      question: userMsg,
      answer: aiResponse,
      keywords: '',
      category: 'geral'
    });
    setActiveTab('examples');
    toast.info('Resposta carregada para adição como exemplo de treinamento');
  };
  const addTrainingExample = async () => {
    if (!newExample.question.trim() || !newExample.answer.trim()) {
      toast.error('Pergunta e resposta são obrigatórias');
      return;
    }

    try {
      const keywords = newExample.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      // Verificar se já existe uma pergunta similar
      const { data: existingExample } = await supabase
        .from('ai_knowledge_base')
        .select('id')
        .eq('question', newExample.question.trim())
        .maybeSingle();

      if (existingExample) {
        toast.error('Já existe um exemplo com esta pergunta na base de conhecimento');
        return;
      }
      
      const { error } = await supabase
        .from('ai_knowledge_base')
        .insert({
          question: newExample.question,
          answer: newExample.answer,
          keywords,
          category: newExample.category,
          priority: 1,
          active: true
        });

      if (error) throw error;

      toast.success('Exemplo de treinamento adicionado!');
      setNewExample({
        question: '',
        answer: '',
        keywords: '',
        category: 'geral'
      });
      
      loadTrainingExamples();
    } catch (error) {
      console.error('Erro ao adicionar exemplo:', error);
      toast.error('Erro ao salvar exemplo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs de navegação */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'chat' ? 'default' : 'outline'}
          onClick={() => setActiveTab('chat')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Chat de Treinamento
        </Button>
        <Button
          variant={activeTab === 'examples' ? 'default' : 'outline'}
          onClick={() => setActiveTab('examples')}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          Exemplos de Treinamento
        </Button>
      </div>

      {/* Chat de Treinamento */}
      {activeTab === 'chat' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat Interativo de Treinamento com Pesquisa Web
            </CardTitle>
            <CardDescription>
              Converse com a IA para testar e treinar suas respostas. A IA pode pesquisar na internet automaticamente quando necessário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Opções avançadas */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Opções Avançadas
                </Button>
                
                <div className="flex gap-2">
                  <Badge variant={isSearching ? "default" : "secondary"}>
                    {isSearching ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Pesquisando...
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        Pesquisa Web Ativa
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {showAdvancedOptions && (
                <Card className="p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Triggers de Pesquisa Web:</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {['tws pro6', 'preços', 'não sei', 'pesquisar'].map(trigger => (
                          <Badge key={trigger} variant="outline" className="text-xs">{trigger}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Escalação para Admin:</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {['reclamação', 'orçamento província', 'preço especial', 'problema técnico'].map(trigger => (
                          <Badge key={trigger} variant="destructive" className="text-xs">{trigger}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Informações da Loja:</Label>
                      <ul className="mt-1 text-xs space-y-1">
                        <li>• WhatsApp: 939729902</li>
                        <li>• Localização: Kilamba J13</li>
                        <li>• Entrega grátis em Luanda</li>
                      </ul>
                    </div>
                    <div>
                      <Label className="font-medium">Funcionalidades:</Label>
                      <ul className="mt-1 text-xs space-y-1">
                        <li>• Pesquisa automática na web</li>
                        <li>• Escalação automática para admin</li>
                        <li>• Base de conhecimento local</li>
                        <li>• Notificações para intervenção</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
              {/* Área do chat */}
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Inicie uma conversa para treinar a IA</p>
                      <p className="text-xs">A IA pode pesquisar na internet automaticamente quando necessário</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-lg border transition-all ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : msg.isSearchResult 
                                ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
                                : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Bot className="h-4 w-4" />
                                {msg.isSearchResult && (
                                  <Badge variant="outline" className="text-xs">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Web
                                  </Badge>
                                )}
                              </div>
                            )}
                            <span className="text-xs opacity-70">
                              {msg.role === 'user' ? 'Você' : 'IA'}
                            </span>
                            <span className="text-xs opacity-50">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                            
                            {msg.role === 'assistant' && (
                              <div className="ml-auto flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(msg.content)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const userMsg = chatMessages.find(m => 
                                      m.role === 'user' && 
                                      chatMessages.indexOf(m) === chatMessages.indexOf(msg) - 1
                                    );
                                    if (userMsg) {
                                      addResponseAsExample(userMsg.content, msg.content);
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          
                          {msg.isSearchResult && msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <Label className="text-xs font-medium">Perguntas relacionadas:</Label>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {msg.relatedQuestions.slice(0, 3).map((question, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6"
                                    onClick={() => sendTrainingMessage(question, true)}
                                  >
                                    {question.length > 30 ? question.substring(0, 30) + '...' : question}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {msg.confidence && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-2 text-xs opacity-70">
                                <CheckCircle className="h-3 w-3" />
                                Confiança: {Math.round(msg.confidence * 100)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {(isTraining || isSearching) && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          {isSearching ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <div className="text-sm">Pesquisando na internet...</div>
                            </>
                          ) : (
                            <>
                              <div className="animate-pulse text-sm">IA está pensando...</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua pergunta para treinar a IA... (ex: o que sabes sobre tws pro6?)"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isTraining && !isSearching) {
                        sendTrainingMessage(currentMessage);
                      }
                    }}
                    disabled={isTraining || isSearching}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendTrainingMessage(currentMessage)}
                    disabled={!currentMessage.trim() || isTraining || isSearching}
                    className="min-w-[100px]"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => sendTrainingMessage(currentMessage, true)}
                    disabled={!currentMessage.trim() || isTraining || isSearching}
                    title="Forçar pesquisa na web"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>A IA pesquisará automaticamente na internet quando necessário</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exemplos de Treinamento */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          {/* Adicionar novo exemplo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Novo Exemplo
              </CardTitle>
              <CardDescription>
                Crie exemplos de perguntas e respostas para treinar a IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pergunta</Label>
                    <Textarea
                      placeholder="Ex: Qual o preço do iPhone 15?"
                      value={newExample.question}
                      onChange={(e) => setNewExample(prev => ({ ...prev, question: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <Input
                      placeholder="Ex: iphone, preço, valor"
                      value={newExample.keywords}
                      onChange={(e) => setNewExample(prev => ({ ...prev, keywords: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe por vírgulas
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Resposta</Label>
                    <Textarea
                      placeholder="Ex: O iPhone 15 custa AOA 350.000. Temos várias cores disponíveis..."
                      value={newExample.answer}
                      onChange={(e) => setNewExample(prev => ({ ...prev, answer: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      value={newExample.category}
                      onChange={(e) => setNewExample(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="geral">Geral</option>
                      <option value="produtos">Produtos</option>
                      <option value="precos">Preços</option>
                      <option value="entrega">Entrega</option>
                      <option value="pagamento">Pagamento</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button onClick={addTrainingExample} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exemplo
              </Button>
            </CardContent>
          </Card>

          {/* Lista de exemplos existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Exemplos de Treinamento ({trainingExamples.length})
              </CardTitle>
              <CardDescription>
                Exemplos atualmente na base de conhecimento da IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {trainingExamples.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum exemplo de treinamento encontrado.</p>
                      <Button variant="outline" className="mt-2" onClick={loadTrainingExamples}>
                        Carregar Exemplos
                      </Button>
                    </div>
                  ) : (
                    trainingExamples.map((example) => (
                      <div key={example.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary">{example.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(example.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium">Pergunta:</Label>
                            <p className="text-sm text-muted-foreground">{example.question}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Resposta:</Label>
                            <p className="text-sm text-muted-foreground">{example.answer}</p>
                          </div>
                          
                          {example.keywords.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Palavras-chave:</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {example.keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrainingChat;