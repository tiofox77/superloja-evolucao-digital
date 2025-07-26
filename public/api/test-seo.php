<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$url = $_GET['url'] ?? 'http://localhost:8080/';
$path = parse_url($url, PHP_URL_PATH);

$response = [
    'success' => true,
    'url' => $url,
    'path' => $path,
    'timestamp' => date('Y-m-d H:i:s'),
    'meta_tags' => [
        'title' => 'SuperLoja - A melhor loja de eletrônicos de Angola',
        'description' => 'Descubra os melhores produtos tecnológicos com ofertas imperdíveis.',
        'keywords' => 'eletrônicos Angola, tecnologia Luanda, smartphones',
        'og_image' => '/src/assets/superloja-logo.png',
        'canonical' => $url,
        'robots' => 'index,follow'
    ]
];

// Teste específico para produto
if (preg_match('/^\/produto\/([^\/]+)$/', $path, $matches)) {
    $productSlug = $matches[1];
    $response['meta_tags']['title'] = ucfirst(str_replace('-', ' ', $productSlug)) . ' - SuperLoja Angola';
    $response['meta_tags']['description'] = 'Compre ' . ucfirst(str_replace('-', ' ', $productSlug)) . ' na SuperLoja com o melhor preço de Angola.';
    $response['meta_tags']['keywords'] = str_replace('-', ' ', $productSlug) . ', Angola, eletrônicos, SuperLoja';
    $response['page_type'] = 'product';
    $response['product_slug'] = $productSlug;
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
