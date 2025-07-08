<?php
declare(strict_types=1);

// sync-templates.php - Script para sincronizar templates do Supabase com o ficheiro local

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Log de acções relacionadas com os templates
 */
function logSync(string $message, string $type = 'info'): void 
{
    $logFile = __DIR__ . '/logs/sync_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Buscar templates do Supabase
 */
function getSupabaseTemplates(): array 
{
    // Se não houver .env, usar credenciais padrão para acesso à base de dados
    $supabaseUrl = getenv('SUPABASE_URL') ?: 'https://cxkhwmxhcmpuqtfkycnt.supabase.co';
    $supabaseKey = getenv('SUPABASE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4a2h3bXhoY21wdXF0Zmt5Y250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI4OTMwMTYsImV4cCI6MjAxODQ2OTAxNn0.lK4yxYI6m4iIJWEJA9FVs7AQC4Aga3E6PSwwIWO2XEE';
    
    logSync("A iniciar sincronização com Supabase: {$supabaseUrl}", "info");
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $supabaseUrl . '/rest/v1/settings?key=eq.notification_templates');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        logSync("Erro CURL na chamada à API: {$curlError}", "error");
        return [];
    }
    
    if (empty($response)) {
        logSync("Resposta vazia do Supabase", "warning");
        return [];
    }
    
    $data = json_decode($response, true);
    if (!is_array($data) || count($data) == 0) {
        logSync("Dados inválidos recebidos do Supabase", "error");
        return [];
    }
    
    // Verificar vários formatos possíveis
    $templates = [];
    
    if (isset($data[0]['value']['email_templates'])) {
        $templates = $data[0]['value']['email_templates'];
        logSync("Formato padrão detectado", "info");
    } elseif (isset($data[0]['value']) && is_array($data[0]['value']) && isset($data[0]['value']['welcome'])) {
        $templates = $data[0]['value'];
        logSync("Formato alternativo detectado", "info");
    }
    
    return $templates;
}

/**
 * Guardar templates no ficheiro local
 */
function saveLocalTemplates(array $templates): bool 
{
    $configFile = __DIR__ . '/config/templates.json';
    $configDir = dirname($configFile);
    
    if (!is_dir($configDir)) {
        mkdir($configDir, 0755, true);
    }
    
    $templatesData = [
        'email_templates' => $templates
    ];
    
    $result = file_put_contents($configFile, json_encode($templatesData, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        logSync("Erro ao guardar templates no ficheiro local", "error");
        return false;
    }
    
    logSync("Templates guardados com sucesso no ficheiro local", "success");
    return true;
}

try {
    // Verificar se é um pedido para forçar a sincronização
    $force = isset($_GET['force']) && $_GET['force'] === 'true';
    
    // Verificar a última sincronização
    $lastSyncFile = __DIR__ . '/config/last_sync.txt';
    $shouldSync = true;
    
    if (file_exists($lastSyncFile) && !$force) {
        $lastSync = (int)file_get_contents($lastSyncFile);
        $currentTime = time();
        $syncInterval = 60 * 5; // 5 minutos
        
        if ($currentTime - $lastSync < $syncInterval) {
            $shouldSync = false;
            logSync("Sincronização ignorada - última sincronização feita há menos de 5 minutos", "info");
        }
    }
    
    if ($shouldSync || $force) {
        // Buscar templates do Supabase
        $supabaseTemplates = getSupabaseTemplates();
        
        if (empty($supabaseTemplates)) {
            throw new Exception("Não foi possível obter templates do Supabase");
        }
        
        // Guardar templates no ficheiro local
        $success = saveLocalTemplates($supabaseTemplates);
        
        if (!$success) {
            throw new Exception("Erro ao guardar templates no ficheiro local");
        }
        
        // Registar hora da sincronização
        file_put_contents($lastSyncFile, time());
        
        echo json_encode([
            'success' => true,
            'message' => 'Templates sincronizados com sucesso',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Sincronização ignorada - muito recente',
            'last_sync' => date('Y-m-d H:i:s', $lastSync)
        ]);
    }
} catch (Exception $e) {
    logSync("Erro: " . $e->getMessage(), "error");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
