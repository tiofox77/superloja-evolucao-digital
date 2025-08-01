// Funções auxiliares para o sistema de IA angolano melhorado

export function detectUserLocation(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Províncias de Angola
  const provinces = [
    'luanda', 'benguela', 'huambo', 'lobito', 'namibe', 'lubango', 'malanje', 
    'cabinda', 'uíge', 'soyo', 'kuanza norte', 'kuanza sul', 'lunda norte', 
    'lunda sul', 'moxico', 'cuando cubango', 'cunene', 'huíla', 'bié'
  ];
  
  for (const province of provinces) {
    if (lowerMessage.includes(province)) {
      return province;
    }
  }
  
  // Bairros de Luanda
  const luandaAreas = [
    'kilamba', 'talatona', 'maianga', 'rangel', 'sambizanga', 'ingombota', 
    'cacuaco', 'viana', 'belas', 'luanda sul', 'ilha do cabo', 'samba'
  ];
  
  for (const area of luandaAreas) {
    if (lowerMessage.includes(area)) {
      return `luanda - ${area}`;
    }
  }
  
  return null;
}

export async function analyzeResponsePatterns(userId: string, message: string, supabase: any) {
  // Buscar mensagens similares do usuário nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: similarMessages } = await supabase
    .from('ai_conversations')
    .select('message, type, timestamp')
    .eq('user_id', userId)
    .eq('type', 'received')
    .gte('timestamp', sevenDaysAgo.toISOString())
    .ilike('message', `%${message.substring(0, 10)}%`);
    
  return {
    count: similarMessages?.length || 0,
    lastSimilar: similarMessages?.[0]?.timestamp,
    isRepetitive: (similarMessages?.length || 0) > 2
  };
}

export async function searchRelevantProducts(query: string, supabase: any) {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, description, category, image_url, stock')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .eq('active', true)
    .limit(5);
    
  return products || [];
}

export function isProductListRequest(message: string): boolean {
  const listKeywords = [
    'publicidade', 'produtos', 'catálogo', 'lista', 'o que tens', 
    'quero ver mais', 'mostra mais', 'outras opções', 'que tens aí',
    'quais produtos', 'ver tudo'
  ];
  
  return listKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

export async function handleProductListRequest(products: any[], userLocation: string | null, supabase: any): Promise<string> {
  if (!products || products.length === 0) {
    return `Eh pá! Neste momento tamos a actualizar o nosso stock. 
    
Contacta-nos pelo WhatsApp 939729902 para veres os produtos mais recentes que chegaram! 📱`;
  }
  
  // Lista resumida primeiro (TOP 3)
  const topProducts = products.slice(0, 3);
  let response = `🔥 TOP 3 MAIS PROCURADOS:\n\n`;
  
  topProducts.forEach((product, index) => {
    const status = product.stock > 0 ? '✅ Em stock' : '❌ Esgotado';
    response += `${index + 1}. ${product.name}
💰 ${product.price} AOA ${status}
📝 ${product.description.substring(0, 80)}...\n\n`;
  });
  
  response += `Queres ver a lista completa? Tenho mais ${products.length - 3} produtos fixes! 😊`;
  
  return response;
}

export function analyzeEnhancedConversationContext(conversations: any[], currentMessage: string, userProfile: any) {
  const context = {
    profileSummary: '',
    learningInsights: '',
    currentMood: 'neutral',
    conversationStage: 'discovery',
    identifiedNeeds: [],
    selectedProduct: null,
    summary: ''
  };
  
  // Análise do perfil
  if (userProfile) {
    context.profileSummary = `Cliente ${userProfile.total_interactions > 5 ? 'frequente' : 'novo'} que prefere comunicação ${userProfile.behavior_patterns?.message_style || 'casual'}`;
    
    if (userProfile.preferences?.product_interests?.length > 0) {
      context.identifiedNeeds = userProfile.preferences.product_interests;
    }
  }
  
  // Análise do humor atual
  const positiveWords = ['obrigado', 'bom', 'excelente', 'gosto', 'perfeito', 'fixe'];
  const negativeWords = ['problema', 'demora', 'difícil', 'complicado', 'caro'];
  
  if (positiveWords.some(word => currentMessage.toLowerCase().includes(word))) {
    context.currentMood = 'positive';
  } else if (negativeWords.some(word => currentMessage.toLowerCase().includes(word))) {
    context.currentMood = 'negative';
  }
  
  // Determinar fase da conversa
  if (conversations.length === 0) {
    context.conversationStage = 'first_contact';
  } else if (conversations.length < 3) {
    context.conversationStage = 'discovery';
  } else if (conversations.some(c => c.message.toLowerCase().includes('preço') || c.message.toLowerCase().includes('comprar'))) {
    context.conversationStage = 'consideration';
  } else {
    context.conversationStage = 'relationship_building';
  }
  
  return context;
}

export async function performIntelligentProductSearch(message: string, context: any, supabase: any) {
  // Buscar produtos baseado na mensagem
  const products = await searchRelevantProducts(message, supabase);
  
  let productsInfo = '';
  if (products.length > 0) {
    productsInfo = '🛍️ PRODUTOS RELEVANTES:\n';
    products.forEach((product: any) => {
      const status = product.stock > 0 ? `✅ Stock: ${product.stock}` : '❌ ESGOTADO';
      productsInfo += `• ${product.name} - ${product.price} AOA ${status}\n  ${product.description}\n\n`;
    });
  } else {
    productsInfo = '⚠️ Nenhum produto específico encontrado para esta consulta';
  }
  
  return { products, productsInfo };
}

export function getPersonalityAdaptation(userProfile: any, context: any): string {
  let adaptation = '🎭 ADAPTAÇÃO DE PERSONALIDADE:\n';
  
  if (context.currentMood === 'negative') {
    adaptation += '- Cliente parece frustrado: Seja extra empático e paciente\n';
    adaptation += '- Use tom mais calmo e oferecimento de soluções\n';
  } else if (context.currentMood === 'positive') {
    adaptation += '- Cliente parece satisfeito: Mantenha energia positiva\n';
    adaptation += '- Aproveite para apresentar produtos\n';
  }
  
  if (userProfile?.behavior_patterns?.urgency_level === 'high') {
    adaptation += '- Cliente costuma ter urgência: Seja directo e eficiente\n';
  } else if (userProfile?.behavior_patterns?.urgency_level === 'low') {
    adaptation += '- Cliente prefere calma: Seja conversacional e detalhado\n';
  }
  
  if (userProfile?.total_interactions > 5) {
    adaptation += '- Cliente frequente: Use familiaridade, referencie conversas anteriores\n';
  } else {
    adaptation += '- Cliente novo: Seja acolhedor, explique processos\n';
  }
  
  return adaptation;
}

export function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}

export function getMostActiveHour(activeHours: any): string {
  if (!activeHours) return 'não definido';
  
  const sortedHours = Object.entries(activeHours)
    .sort(([,a], [,b]) => (b as number) - (a as number));
  
  if (sortedHours.length === 0) return 'não definido';
  
  const hour = parseInt(sortedHours[0][0]);
  return `${hour}:00-${hour + 1}:00`;
}

export function createAngolanResponses() {
  return {
    greetings: [
      'Eh pá!', 'Bom mano!', 'Oi meu caro!', 'Bom dia minha cara!', 
      'Como vai?', 'Tudo bem?', 'Que tal?'
    ],
    
    excitement: [
      'Bué fixe!', 'Porreiro demais!', 'Isso sim é top!', 'Que coisa boa!',
      'Tá fixe assim!', 'Bué bom mesmo!', 'Adoro isso!'
    ],
    
    persuasion: [
      'Acredita que...', 'Sabes que...', 'Olha só...', 'Deixa-me te contar...',
      'Vou te dizer uma coisa...', 'Escuta bem...', 'Posso te garantir...'
    ],
    
    transitions: [
      'Agora vamos falar do que importa...', 'Falando nisso...',
      'Já agora...', 'Apropos...', 'Por falar nisso...'
    ],
    
    empathy: [
      'Compreendo perfeitamente...', 'Sei como é...', 'Já passei por isso...',
      'Entendo a tua situação...', 'Imagino como te sentes...'
    ]
  };
}