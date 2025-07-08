<?php
// get-templates.php - Script para fornecer templates de email do ficheiro JSON local

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once __DIR__ . '/vendor/autoload.php';

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
        
        file_put_contents($configFile, json_encode($defaultTemplates, JSON_PRETTY_PRINT));
        logTemplate("Criado ficheiro de templates padrão", "info");
    }
    
    $templates = json_decode(file_get_contents($configFile), true);
    if (!$templates) {
        throw new Exception("Erro ao ler ficheiro de templates");
    }
    
    return $templates;
}

/**
 * Actualizar templates no ficheiro de configurações
 */
function updateTemplates($newTemplates) {
    $configFile = __DIR__ . '/config/templates.json';
    $result = file_put_contents($configFile, json_encode($newTemplates, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        throw new Exception("Erro ao guardar templates");
    }
    
    return true;
}

try {
    // Verificar se é um pedido para actualizar ou para obter templates
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Retornar templates actuais
        $templates = getTemplates();
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
        throw new Exception("Método não suportado");
    }
} catch (Exception $e) {
    logTemplate("Erro: " . $e->getMessage(), "error");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
