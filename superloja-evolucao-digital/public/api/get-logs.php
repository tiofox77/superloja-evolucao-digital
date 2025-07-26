<?php
/**
 * SuperLoja - API de Logs
 * Retorna logs de email e configuração para o painel administrativo
 */

// Configurações de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar se é GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit();
}

/**
 * Função para ler logs do sistema
 * @param string $logType Tipo de log (email ou config)
 * @param int $limit Número máximo de logs a retornar (0 = sem limite)
 * @param int $days Número de dias para buscar logs (1 = só hoje, 0 = todos)
 * @return array Array com entradas de log
 */
function readLogs($logType = 'email', $limit = 50, $days = 7) {
    $logs = [];
    $baseDir = __DIR__ . '/logs/';
    
    if (!is_dir($baseDir)) {
        return $logs;
    }
    
    // Determinar quais arquivos de log ler
    $logFiles = [];
    
    if ($days > 0) {
        // Ler logs dos últimos X dias
        for ($i = 0; $i < $days; $i++) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $fileName = "{$logType}_{$date}.log";
            if (file_exists($baseDir . $fileName)) {
                $logFiles[] = $baseDir . $fileName;
            }
        }
    } else {
        // Ler todos os logs deste tipo
        $pattern = $baseDir . "{$logType}_*.log";
        $logFiles = glob($pattern);
    }
    
    // Ler os arquivos de log
    foreach ($logFiles as $file) {
        if (file_exists($file)) {
            $contents = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            
            if ($contents) {
                foreach ($contents as $line) {
                    // Extrair timestamp, tipo e mensagem
                    if (preg_match('/\[(.*?)\]\s+\[(.*?)\]\s+(.*?)$/', $line, $matches)) {
                        $logs[] = [
                            'timestamp' => $matches[1],
                            'status' => $matches[2] == 'error' ? 'error' : 
                                       ($matches[2] == 'success' ? 'success' : 'processing'),
                            'message' => $matches[3],
                            'type' => $logType,
                            'id' => md5($matches[1] . $matches[3])  // ID único baseado no timestamp e mensagem
                        ];
                    }
                }
            }
        }
    }
    
    // Ordenar logs por data (mais recentes primeiro)
    usort($logs, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Limitar número de registros
    if ($limit > 0 && count($logs) > $limit) {
        $logs = array_slice($logs, 0, $limit);
    }
    
    return $logs;
}

// Obter parâmetros da requisição
$logType = isset($_GET['type']) ? $_GET['type'] : 'all';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$days = isset($_GET['days']) ? intval($_GET['days']) : 7;

try {
    $result = [];
    
    if ($logType === 'all') {
        // Retornar todos os tipos de logs
        $emailLogs = readLogs('email', $limit, $days);
        $configLogs = readLogs('config', $limit, $days);
        
        // Combinar e ordenar por data
        $allLogs = array_merge($emailLogs, $configLogs);
        usort($allLogs, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        // Limitar resultado combinado
        if ($limit > 0 && count($allLogs) > $limit) {
            $allLogs = array_slice($allLogs, 0, $limit);
        }
        
        $result = $allLogs;
    } else {
        // Retornar logs específicos
        $result = readLogs($logType, $limit, $days);
    }
    
    echo json_encode([
        'success' => true,
        'logs' => $result,
        'total' => count($result),
        'type' => $logType,
        'days' => $days
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
