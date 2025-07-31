// Função para extrair informações do usuário da mensagem
export function extractUserInfo(message: string) {
  const info: any = {};
  
  // Extrair nome (padrões comuns)
  const namePatterns = [
    /(?:meu nome é|me chamo|sou o|sou a|nome:)\s*([a-záêçõ\s]+)/i,
    /^([a-záêçõ]+\s+[a-záêçõ]+)/i // Nome no início da mensagem
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.name = match[1].trim();
      break;
    }
  }
  
  // Extrair telefone
  const phonePattern = /(\d{9}|\d{3}\s?\d{3}\s?\d{3}|9\d{8})/g;
  const phoneMatch = message.match(phonePattern);
  if (phoneMatch) {
    info.contact = phoneMatch[0];
  }
  
  // Extrair endereço (padrões específicos de Angola)
  const addressPatterns = [
    /(?:endereço|morada|vivo em|moro em|entregar em):?\s*([^,\n]+)/i,
    /(kilamba|talatona|maianga|rangel|sambizanga|ingombota|cacuaco|viana|belas|luanda sul|ilha do cabo|samba)\s*[^,\n]*/i,
    /([a-záêçõ\s]+(?:j\d+|quarteirão|rua|avenida|bairro)[^,\n]*)/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = message.match(pattern);
    if (match) {
      info.address = match[1] || match[0];
      break;
    }
  }
  
  return Object.keys(info).length > 0 ? info : null;
}