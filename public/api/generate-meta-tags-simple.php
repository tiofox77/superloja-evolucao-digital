<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configurações padrão
$defaultMeta = [
    'title' => 'SuperLoja - A melhor loja de eletrônicos de Angola',
    'description' => 'Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na SuperLoja!',
    'keywords' => 'eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola',
    'og_image' => '/src/assets/superloja-logo.png',
    'canonical' => '',
    'robots' => 'index,follow',
    'site_name' => 'SuperLoja',
    'favicon' => '/favicon.ico'
];

$url = $_GET['url'] ?? '';
$path = parse_url($url, PHP_URL_PATH);

// Analisar a URL e gerar meta tags apropriadas
$metaTags = $defaultMeta;

// Página inicial
if ($path === '/' || $path === '') {
    $metaTags['title'] = 'SuperLoja - A melhor loja de eletrônicos de Angola';
    $metaTags['description'] = 'Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na SuperLoja!';
    $metaTags['keywords'] = 'eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola';
    $metaTags['canonical'] = 'http://localhost:8080/';
}

// Página de produto
elseif (preg_match('/^\/produto\/([^\/]+)$/', $path, $matches)) {
    $productSlug = $matches[1];
    $productName = ucfirst(str_replace('-', ' ', $productSlug));
    
    $metaTags['title'] = $productName . ' - SuperLoja Angola';
    $metaTags['description'] = "Compre {$productName} na SuperLoja com o melhor preço de Angola. Produto de qualidade com garantia.";
    $metaTags['keywords'] = "{$productName}, Angola, eletrônicos, SuperLoja, tecnologia";
    $metaTags['canonical'] = "http://localhost:8080/produto/{$productSlug}";
    
    // Schema.org para produto
    $metaTags['schema'] = [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $productName,
        'description' => "Compre {$productName} na SuperLoja com o melhor preço de Angola.",
        'brand' => [
            '@type' => 'Brand',
            'name' => 'SuperLoja'
        ],
        'offers' => [
            '@type' => 'Offer',
            'priceCurrency' => 'AOA',
            'availability' => 'https://schema.org/InStock'
        ]
    ];
}

// Página de categoria
elseif (preg_match('/^\/categoria\/([^\/]+)$/', $path, $matches)) {
    $categorySlug = $matches[1];
    $categoryName = ucfirst(str_replace('-', ' ', $categorySlug));
    
    $metaTags['title'] = $categoryName . ' - SuperLoja Angola';
    $metaTags['description'] = "Explore nossa seleção de {$categoryName} com os melhores preços de Angola. Produtos de qualidade na SuperLoja!";
    $metaTags['keywords'] = "{$categoryName}, Angola, eletrônicos, SuperLoja, tecnologia";
    $metaTags['canonical'] = "http://localhost:8080/categoria/{$categorySlug}";
}

// Página de catálogo
elseif ($path === '/catalogo') {
    $metaTags['title'] = 'Catálogo de Produtos - SuperLoja Angola';
    $metaTags['description'] = 'Explore nosso catálogo completo de produtos tecnológicos com os melhores preços de Angola. Smartphones, computadores, acessórios e muito mais!';
    $metaTags['keywords'] = 'catálogo, produtos, eletrônicos, Angola, SuperLoja, tecnologia';
    $metaTags['canonical'] = 'http://localhost:8080/catalogo';
}

// Página de leilões
elseif ($path === '/leiloes') {
    $metaTags['title'] = 'Leilões - SuperLoja Angola';
    $metaTags['description'] = 'Participe dos nossos leilões e ganhe produtos tecnológicos com preços incríveis! Leilões diários na SuperLoja.';
    $metaTags['keywords'] = 'leilões, produtos, ofertas, Angola, SuperLoja, tecnologia';
    $metaTags['canonical'] = 'http://localhost:8080/leiloes';
}

// Outras páginas
else {
    $pageName = trim($path, '/');
    if ($pageName) {
        $pageTitle = ucfirst(str_replace('-', ' ', $pageName));
        $metaTags['title'] = $pageTitle . ' - SuperLoja Angola';
        $metaTags['description'] = "Página {$pageTitle} da SuperLoja - A melhor loja de eletrônicos de Angola.";
        $metaTags['canonical'] = "http://localhost:8080/{$pageName}";
    }
}

echo json_encode($metaTags, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
