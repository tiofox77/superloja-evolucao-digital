<?php
/**
 * SuperLoja - Gerador de Arquivos de Configuração
 * Cria e atualiza arquivos de configuração para o sistema
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Função para registrar logs
function logConfigGenerator($message, $type = 'info') {
    $logFile = __DIR__ . '/logs/config_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Função para criar diretórios necessários
function createDirectories() {
    $directories = [
        __DIR__ . '/config',
        __DIR__ . '/logs',
        __DIR__ . '/backup'
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0755, true)) {
                throw new Exception("Não foi possível criar diretório: $dir");
            }
            logConfigGenerator("Diretório criado: $dir", 'info');
        }
    }
}

// Função para gerar configuração SMTP
function generateSmtpConfig($config) {
    $smtpConfig = [
        'smtp_host' => $config['smtp_host'] ?? '',
        'smtp_port' => $config['smtp_port'] ?? '587',
        'smtp_user' => $config['smtp_user'] ?? '',
        'smtp_password' => $config['smtp_password'] ?? '',
        'smtp_from_email' => $config['smtp_from_email'] ?? '',
        'smtp_from_name' => $config['smtp_from_name'] ?? 'SuperLoja',
        'smtp_use_tls' => $config['smtp_use_tls'] ?? true,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    $configFile = __DIR__ . '/config/smtp.json';
    
    if (file_put_contents($configFile, json_encode($smtpConfig, JSON_PRETTY_PRINT))) {
        logConfigGenerator("Configuração SMTP atualizada com sucesso", 'success');
        return true;
    } else {
        throw new Exception("Erro ao salvar configuração SMTP");
    }
}

// Função para gerar arquivo .htaccess
function generateHtaccess() {
    $htaccessContent = '# SuperLoja - Configurações do servidor
RewriteEngine On

# Redirecionamento para HTTPS (descomente se necessário)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Roteamento para React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache do navegador
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Segurança
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Proteger arquivos de configuração
<Files "*.json">
    Order Allow,Deny
    Deny from all
</Files>

<Files "*.log">
    Order Allow,Deny
    Deny from all
</Files>
';

    $htaccessFile = __DIR__ . '/../.htaccess';
    
    if (file_put_contents($htaccessFile, $htaccessContent)) {
        logConfigGenerator("Arquivo .htaccess atualizado com sucesso", 'success');
        return true;
    } else {
        throw new Exception("Erro ao criar arquivo .htaccess");
    }
}

// Função para criar backup das configurações
function createConfigBackup() {
    $backupDir = __DIR__ . '/backup';
    $backupFile = $backupDir . '/config_backup_' . date('Y-m-d_H-i-s') . '.json';
    
    $configFiles = [
        'smtp' => __DIR__ . '/config/smtp.json'
    ];
    
    $backup = [];
    foreach ($configFiles as $type => $file) {
        if (file_exists($file)) {
            $backup[$type] = json_decode(file_get_contents($file), true);
        }
    }
    
    if (file_put_contents($backupFile, json_encode($backup, JSON_PRETTY_PRINT))) {
        logConfigGenerator("Backup das configurações criado: " . basename($backupFile), 'success');
        return $backupFile;
    } else {
        throw new Exception("Erro ao criar backup das configurações");
    }
}

// Função para verificar status do sistema
function checkSystemStatus() {
    $status = [
        'directories' => [],
        'config_files' => [],
        'permissions' => [],
        'php_version' => phpversion(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Verificar diretórios
    $directories = [
        'config' => __DIR__ . '/config',
        'logs' => __DIR__ . '/logs',
        'backup' => __DIR__ . '/backup'
    ];
    
    foreach ($directories as $name => $path) {
        $status['directories'][$name] = [
            'exists' => is_dir($path),
            'writable' => is_writable($path),
            'path' => $path
        ];
    }
    
    // Verificar arquivos de configuração
    $configFiles = [
        'smtp' => __DIR__ . '/config/smtp.json'
    ];
    
    foreach ($configFiles as $name => $path) {
        $status['config_files'][$name] = [
            'exists' => file_exists($path),
            'readable' => is_readable($path),
            'size' => file_exists($path) ? filesize($path) : 0,
            'modified' => file_exists($path) ? date('Y-m-d H:i:s', filemtime($path)) : null
        ];
    }
    
    // Verificar permissões
    $status['permissions']['api_dir'] = is_writable(__DIR__);
    $status['permissions']['public_dir'] = is_writable(__DIR__ . '/../');
    
    return $status;
}

try {
    // Criar diretórios necessários
    createDirectories();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['action'])) {
            throw new Exception('Ação não especificada');
        }
        
        $action = $input['action'];
        $response = ['success' => true, 'message' => '', 'data' => null];
        
        switch ($action) {
            case 'generate_smtp_config':
                if (!isset($input['config'])) {
                    throw new Exception('Configurações SMTP não fornecidas');
                }
                
                generateSmtpConfig($input['config']);
                $response['message'] = 'Configuração SMTP gerada com sucesso';
                logConfigGenerator("Configuração SMTP gerada via API", 'info');
                break;
                
            case 'generate_htaccess':
                generateHtaccess();
                $response['message'] = 'Arquivo .htaccess gerado com sucesso';
                logConfigGenerator("Arquivo .htaccess gerado via API", 'info');
                break;
                
            case 'create_backup':
                $backupFile = createConfigBackup();
                $response['message'] = 'Backup criado com sucesso';
                $response['data'] = ['backup_file' => basename($backupFile)];
                break;
                
            case 'check_status':
                $response['data'] = checkSystemStatus();
                $response['message'] = 'Status do sistema verificado';
                break;
                
            default:
                throw new Exception("Ação '$action' não reconhecida");
        }
        
        echo json_encode($response);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Retornar status do sistema
        echo json_encode([
            'success' => true,
            'message' => 'Sistema operacional',
            'data' => checkSystemStatus()
        ]);
    }
    
} catch (Exception $e) {
    logConfigGenerator("Erro no gerador de configuração: " . $e->getMessage(), 'error');
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>