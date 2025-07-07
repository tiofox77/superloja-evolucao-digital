<?php
/**
 * SuperLoja - Endpoint PHP para envio de emails via SMTP
 * Compatível com cPanel e hospedagem compartilhada
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

// Incluir PHPMailer (você precisa fazer upload via cPanel)
require_once 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Função para registrar logs
function logEmail($message, $type = 'info') {
    $logFile = __DIR__ . '/logs/email_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Função para carregar configurações SMTP
function loadSmtpConfig() {
    $configFile = __DIR__ . '/config/smtp.json';
    
    if (!file_exists($configFile)) {
        throw new Exception('Arquivo de configuração SMTP não encontrado');
    }
    
    $config = json_decode(file_get_contents($configFile), true);
    
    if (!$config) {
        throw new Exception('Erro ao ler configurações SMTP');
    }
    
    return $config;
}

try {
    // Receber dados do POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Dados inválidos recebidos');
    }
    
    // Validar campos obrigatórios
    $required = ['type', 'to', 'userName'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Campo obrigatório '$field' não fornecido");
        }
    }
    
    // Carregar configurações SMTP
    $smtpConfig = loadSmtpConfig();
    
    // Criar templates de email
    $templates = [
        'welcome' => [
            'subject' => 'Bem-vindo à SuperLoja!',
            'body' => 'Olá {userName}! Sua conta foi criada com sucesso. Aproveite nossas ofertas especiais!'
        ],
        'order_created' => [
            'subject' => 'Pedido Confirmado #{orderNumber}',
            'body' => 'Seu pedido #{orderNumber} foi criado com sucesso! Total: {orderTotal}. Acompanhe o status em nossa plataforma.'
        ],
        'status_changed' => [
            'subject' => 'Status do Pedido Atualizado',
            'body' => 'Seu pedido #{orderNumber} teve o status alterado para: {newStatus}. Fique atento às atualizações!'
        ]
    ];
    
    $type = $input['type'];
    $to = $input['to'];
    $userName = $input['userName'];
    $orderNumber = $input['orderNumber'] ?? '';
    $orderTotal = $input['orderTotal'] ?? '';
    $newStatus = $input['newStatus'] ?? '';
    
    // Verificar se o template existe
    if (!isset($templates[$type])) {
        throw new Exception("Tipo de email '$type' não suportado");
    }
    
    $template = $templates[$type];
    
    // Substituir variáveis no template
    $subject = str_replace(
        ['{userName}', '{orderNumber}', '{orderTotal}', '{newStatus}'],
        [$userName, $orderNumber, $orderTotal, $newStatus],
        $template['subject']
    );
    
    $body = str_replace(
        ['{userName}', '{orderNumber}', '{orderTotal}', '{newStatus}'],
        [$userName, $orderNumber, $orderTotal, $newStatus],
        $template['body']
    );
    
    // Configurar PHPMailer
    $mail = new PHPMailer(true);
    
    // Configurações do servidor SMTP
    $mail->isSMTP();
    $mail->Host = $smtpConfig['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtpConfig['smtp_user'];
    $mail->Password = $smtpConfig['smtp_password'];
    $mail->SMTPSecure = $smtpConfig['smtp_use_tls'] ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = (int)$smtpConfig['smtp_port'];
    
    // Configurações do email
    $mail->setFrom($smtpConfig['smtp_from_email'], $smtpConfig['smtp_from_name']);
    $mail->addAddress($to);
    
    // Conteúdo do email
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
        <h2 style='color: #4F46E5;'>$subject</h2>
        <p style='line-height: 1.6; color: #333;'>" . nl2br(htmlspecialchars($body)) . "</p>
        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
        <p style='font-size: 12px; color: #666;'>
            Esta é uma mensagem automática da SuperLoja. Não responda a este email.
        </p>
    </div>
    ";
    
    // Enviar email
    $mail->send();
    
    // Log de sucesso
    logEmail("Email '$type' enviado com sucesso para: $to", 'success');
    
    // Resposta de sucesso
    echo json_encode([
        'success' => true,
        'message' => 'Email enviado com sucesso',
        'data' => [
            'type' => $type,
            'to' => $to,
            'subject' => $subject,
            'sent_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    // Log de erro
    logEmail("Erro ao enviar email: " . $e->getMessage(), 'error');
    
    // Resposta de erro
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>