<?php
// Arquivo de teste simples
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'PHP está funcionando!',
    'php_version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
