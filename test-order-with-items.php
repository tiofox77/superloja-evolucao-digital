<?php
// Teste para verificar se o PDF é gerado corretamente com os dados dos itens
header('Content-Type: text/html; charset=utf-8');

// Simular dados completos de um pedido incluindo itens
$orderData = [
    'type' => 'order_created',
    'to' => 'carlosfox1782@gmail.com',
    'userName' => 'Carlos Fernando',
    'orderNumber' => 'TEST-ORDER-' . date('YmdHis'),
    'orderTotal' => 85000,
    'orderPhone' => '+244923456789',
    'orderAddress' => 'Rua Test, 123, Luanda, Angola',
    'items' => [
        [
            'id' => 'prod1',
            'name' => 'Smartphone Samsung Galaxy A54',
            'price' => 45000,
            'quantity' => 1,
            'image' => 'https://via.placeholder.com/150'
        ],
        [
            'id' => 'prod2',
            'name' => 'Fones de Ouvido Bluetooth',
            'price' => 20000,
            'quantity' => 2,
            'image' => 'https://via.placeholder.com/150'
        ]
    ],
    'force_real' => true
];

echo '<h1>Teste de Pedido com Itens</h1>';
echo '<h2>Dados enviados:</h2>';
echo '<pre>' . print_r($orderData, true) . '</pre>';

// Fazer a requisição para o endpoint
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/superlojareact/public/api/send-email.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo '<h2>Resposta da API:</h2>';
echo '<pre>' . htmlspecialchars($response) . '</pre>';

$responseData = json_decode($response, true);
echo '<h2>Resposta decodificada:</h2>';
echo '<pre>' . print_r($responseData, true) . '</pre>';

if ($responseData && isset($responseData['success']) && $responseData['success']) {
    echo '<div style="background-color: #d4edda; padding: 15px; border: 1px solid #c3e6cb; border-radius: 5px;">';
    echo '<h3>✅ Email enviado com sucesso!</h3>';
    echo '<p>Verificar a caixa de entrada em: ' . $orderData['to'] . '</p>';
    echo '</div>';
} else {
    echo '<div style="background-color: #f8d7da; padding: 15px; border: 1px solid #f5c6cb; border-radius: 5px;">';
    echo '<h3>❌ Erro no envio do email</h3>';
    echo '<p>Erro: ' . ($responseData['error'] ?? 'Erro desconhecido') . '</p>';
    echo '</div>';
}

// Listar PDFs gerados
echo '<h2>PDFs gerados:</h2>';
$pdfDir = 'c:/laragon/www/superlojareact/public/api/pdfs/';
if (is_dir($pdfDir)) {
    $files = scandir($pdfDir);
    $files = array_filter($files, function($file) {
        return pathinfo($file, PATHINFO_EXTENSION) === 'pdf';
    });
    
    // Ordenar por data de modificação (mais recente primeiro)
    usort($files, function($a, $b) use ($pdfDir) {
        return filemtime($pdfDir . $b) - filemtime($pdfDir . $a);
    });
    
    if (count($files) > 0) {
        echo '<ul>';
        foreach ($files as $file) {
            $filepath = $pdfDir . $file;
            $size = filesize($filepath);
            $sizeFormatted = $size > 1024 ? number_format($size / 1024, 2) . ' KB' : $size . ' bytes';
            $modTime = date('Y-m-d H:i:s', filemtime($filepath));
            echo '<li>';
            echo '<a href="/api/pdfs/' . $file . '" target="_blank">' . $file . '</a>';
            echo ' (' . $sizeFormatted . ' - ' . $modTime . ')';
            echo '</li>';
        }
        echo '</ul>';
    } else {
        echo '<p>Nenhum PDF encontrado.</p>';
    }
} else {
    echo '<p>Diretório de PDFs não encontrado.</p>';
}
?>
