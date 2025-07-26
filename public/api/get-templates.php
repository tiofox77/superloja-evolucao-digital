<?php
// get-templates.php - Script para fornecer templates de email do ficheiro JSON local

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, Pragma');
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar se é GET ou POST
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

/**
 * Log de acções relacionadas com os templates
 */
function logTemplate($message, $type = 'info') {
    $logFile = __DIR__ . '/logs/template_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Buscar templates do ficheiro de configurações local
 */
function getTemplates() {
    $configFile = __DIR__ . '/config/templates.json';
    $configDir = dirname($configFile);
    
    // Criar diretório config se não existir
    if (!is_dir($configDir)) {
        if (!mkdir($configDir, 0755, true)) {
            throw new Exception("Erro ao criar diretório de configuração");
        }
    }
    
    if (!file_exists($configFile)) {
        // Se não existir, criar ficheiro de templates padrão
        $defaultTemplates = [
            'email_templates' => [
                'welcome' => [
                    'subject' => 'Bem-vindo à SuperLoja!',
                    'body' => '<h3>Olá {userName}!</h3><p>Sua conta na SuperLoja foi criada com sucesso! Agora você pode aproveitar todas as nossas ofertas.</p>',
                    'enabled' => true
                ],
                'order_created' => [
                    'subject' => 'Pedido #{orderNumber} Confirmado',
                    'body' => '<h3>Obrigado pela sua compra, {userName}!</h3><p>Seu pedido <strong>#{orderNumber}</strong> foi criado com sucesso!</p><p>Valor total: <strong>{orderTotal} AOA</strong></p>',
                    'enabled' => true
                ],
                'status_changed' => [
                    'subject' => 'Atualização do Pedido #{orderNumber}',
                    'body' => '<h3>Olá {userName}!</h3><p>Seu pedido <strong>#{orderNumber}</strong> foi atualizado para: {newStatus}</p>',
                    'enabled' => true
                ],
                'contact_form' => [
                    'subject' => 'Confirmação de Contacto',
                    'body' => '<h3>Olá {userName}!</h3><p>Recebemos sua mensagem enviada através do formulário de contacto.</p>',
                    'enabled' => true
                ]
            ]
        ];
        
        $result = file_put_contents($configFile, json_encode($defaultTemplates, JSON_PRETTY_PRINT));
        if ($result === false) {
            throw new Exception("Erro ao criar ficheiro de templates padrão");
        }
        logTemplate("Criado ficheiro de templates padrão", "info");
    }
    
    $content = file_get_contents($configFile);
    if ($content === false) {
        throw new Exception("Erro ao ler ficheiro de templates");
    }
    
    $templates = json_decode($content, true);
    if (!$templates) {
        throw new Exception("Erro ao decodificar JSON do ficheiro de templates");
    }
    
    return $templates;
}

/**
 * Actualizar templates no ficheiro de configurações
 */
function updateTemplates($newTemplates) {
    $configFile = __DIR__ . '/config/templates.json';
    $configDir = dirname($configFile);
    
    // Criar diretório config se não existir
    if (!is_dir($configDir)) {
        if (!mkdir($configDir, 0755, true)) {
            throw new Exception("Erro ao criar diretório de configuração");
        }
    }
    
    // Validar se os dados são válidos
    if (!is_array($newTemplates)) {
        throw new Exception("Dados de templates inválidos");
    }
    
    $result = file_put_contents($configFile, json_encode($newTemplates, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        throw new Exception("Erro ao guardar templates no ficheiro");
    }
    
    return true;
}

try {
    // Log da requisição
    logTemplate("Requisição recebida: " . $_SERVER['REQUEST_METHOD'] . " de " . $_SERVER['HTTP_HOST'], "info");
    
    // Verificar se é um pedido para actualizar ou para obter templates
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Retornar templates actuais
        $templates = getTemplates();
        logTemplate("Templates enviados com sucesso", "info");
        echo json_encode([
            'success' => true,
            'templates' => $templates
        ]);
    } elseif ($method === 'POST') {
        // Receber novos templates e actualizar
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['templates'])) {
            throw new Exception("Dados inválidos recebidos");
        }
        
        $result = updateTemplates($input['templates']);
        logTemplate("Templates actualizados via API", "info");
        
        echo json_encode([
            'success' => true,
            'message' => 'Templates actualizados com sucesso'
        ]);
    } else {
        throw new Exception("Método não suportado: " . $method);
    }
} catch (Exception $e) {
    logTemplate("Erro: " . $e->getMessage(), "error");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
