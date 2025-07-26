<?php
/**
 * Teste de conectividade SMTP
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function loadSmtpConfig() {
    $configFile = __DIR__ . '/config/smtp.json';
    
    if (!file_exists($configFile)) {
        throw new Exception("Arquivo de configuração SMTP não encontrado: $configFile");
    }
    
    $config = json_decode(file_get_contents($configFile), true);
    if (!$config) {
        throw new Exception("Erro ao decodificar configuração SMTP");
    }
    
    return $config;
}

try {
    // Testar carregamento da configuração
    $config = loadSmtpConfig();
    
    $response = [
        'config_loaded' => true,
        'config' => [
            'host' => $config['smtp_host'] ?? 'N/A',
            'port' => $config['smtp_port'] ?? 'N/A',
            'user' => $config['smtp_user'] ?? 'N/A',
            'use_tls' => $config['smtp_use_tls'] ?? false
        ]
    ];
    
    // Testar conectividade básica com socket
    $host = $config['smtp_host'] ?? '';
    $port = intval($config['smtp_port'] ?? 587);
    
    if ($host) {
        $socket = @fsockopen($host, $port, $errno, $errstr, 10);
        if ($socket) {
            $response['socket_test'] = 'SUCCESS';
            fclose($socket);
        } else {
            $response['socket_test'] = "FAILED: $errstr ($errno)";
        }
    }
    
    // Testar PHPMailer
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_password'];
    // Configurar SSL/TLS baseado na porta e configuração
    if (isset($config['smtp_use_ssl']) && $config['smtp_use_ssl']) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL para porta 465
    } elseif (isset($config['smtp_use_tls']) && $config['smtp_use_tls']) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // TLS para porta 587
    } else {
        // Auto-detectar baseado na porta
        $mail->SMTPSecure = (intval($config['smtp_port']) === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    }
    $mail->Port = intval($config['smtp_port']);
    
    // Tentar conectar
    try {
        $mail->smtpConnect();
        $response['smtp_connect'] = 'SUCCESS';
        $mail->smtpClose();
    } catch (Exception $e) {
        $response['smtp_connect'] = 'FAILED: ' . $e->getMessage();
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
?>
