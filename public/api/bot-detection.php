<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function isBotRequest(): bool {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $bots = [
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'facebookexternalhit',
        'twitterbot',
        'linkedinbot',
        'whatsapp',
        'telegrambot',
        'applebot',
        'crawler',
        'spider',
        'bot'
    ];
    
    $userAgentLower = strtolower($userAgent);
    
    foreach ($bots as $bot) {
        if (strpos($userAgentLower, $bot) !== false) {
            return true;
        }
    }
    
    return false;
}

function getBotType(): string {
    $userAgent = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    
    if (strpos($userAgent, 'googlebot') !== false) return 'Google';
    if (strpos($userAgent, 'bingbot') !== false) return 'Bing';
    if (strpos($userAgent, 'facebookexternalhit') !== false) return 'Facebook';
    if (strpos($userAgent, 'twitterbot') !== false) return 'Twitter';
    if (strpos($userAgent, 'linkedinbot') !== false) return 'LinkedIn';
    if (strpos($userAgent, 'whatsapp') !== false) return 'WhatsApp';
    if (strpos($userAgent, 'telegrambot') !== false) return 'Telegram';
    if (strpos($userAgent, 'applebot') !== false) return 'Apple';
    if (strpos($userAgent, 'yandexbot') !== false) return 'Yandex';
    if (strpos($userAgent, 'baiduspider') !== false) return 'Baidu';
    if (strpos($userAgent, 'duckduckbot') !== false) return 'DuckDuckGo';
    
    return 'Unknown Bot';
}

function logBotVisit(string $url, string $botType): void {
    $logFile = __DIR__ . '/../../logs/bot-visits.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'bot_type' => $botType,
        'url' => $url,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
        'referer' => $_SERVER['HTTP_REFERER'] ?? ''
    ];
    
    $logLine = json_encode($logEntry) . "\n";
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

// Processar requisição
$url = $_GET['url'] ?? $_SERVER['REQUEST_URI'] ?? '';
$isBot = isBotRequest();

if ($isBot) {
    $botType = getBotType();
    logBotVisit($url, $botType);
    
    echo json_encode([
        'is_bot' => true,
        'bot_type' => $botType,
        'should_prerender' => true,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} else {
    echo json_encode([
        'is_bot' => false,
        'should_prerender' => false,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
