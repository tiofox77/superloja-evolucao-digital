/**
 * Utilitário para sincronizar templates com o backend PHP
 */

interface TemplateData {
  email_templates: {
    [key: string]: {
      subject: string;
      body: string;
      enabled: boolean;
    };
  };
}

export const syncTemplatesWithBackend = async (templates: TemplateData): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
  try {
    // Cache busting para evitar problemas com service worker
    const timestamp = Date.now();
    const url = `http://localhost/superlojareact/public/api/get-templates.php?t=${timestamp}`;
    
    console.log('Sincronizando templates com backend:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templates: templates
      })
    });

    console.log('Resposta do backend:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro no backend:', errorText);
      
      return {
        success: false,
        message: `Erro ${response.status}: ${response.statusText}`,
        error: errorText
      };
    }

    const data = await response.json();
    console.log('Dados recebidos do backend:', data);

    return {
      success: data.success || false,
      message: data.message || 'Templates sincronizados com sucesso',
      error: data.error
    };

  } catch (error) {
    console.error('Erro ao sincronizar templates:', error);
    
    return {
      success: false,
      message: 'Erro de conexão com o backend',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

export const testTemplateEndpoint = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> => {
  try {
    const timestamp = Date.now();
    const url = `http://localhost/superlojareact/public/api/get-templates.php?t=${timestamp}`;
    
    console.log('Testando endpoint de templates:', url);
    
    // Primeira tentativa com configuração completa
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (corsError) {
      console.log('Erro CORS na primeira tentativa, tentando fallback:', corsError);
      
      // Fallback: fetch simples sem headers customizados
      response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors'
      });
    }

    console.log('Resposta do teste:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro no teste:', errorText);
      
      return {
        success: false,
        message: `Erro ${response.status}: ${response.statusText}`,
        error: errorText
      };
    }

    const data = await response.json();
    console.log('Dados do teste:', data);

    return {
      success: data.success || false,
      message: 'Endpoint funcionando corretamente',
      data: data.templates
    };

  } catch (error) {
    console.error('Erro ao testar endpoint:', error);
    
    return {
      success: false,
      message: 'Erro de conexão com o endpoint',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
