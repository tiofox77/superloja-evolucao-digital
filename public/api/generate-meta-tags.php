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
    'robots' => 'index,follow'
];

// Conectar ao banco de dados
try {
    $host = 'localhost';
    $dbname = 'superloja';
    $username = 'root';
    $password = '';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$url = $_GET['url'] ?? '';
$path = parse_url($url, PHP_URL_PATH);

// Analisar a URL e gerar meta tags apropriadas
$metaTags = $defaultMeta;

// Página inicial
if ($path === '/' || $path === '') {
    $metaTags['title'] = 'SuperLoja - A melhor loja de eletrônicos de Angola';
    $metaTags['description'] = 'Descubra os melhores produtos tecnológicos com ofertas imperdíveis. Smartphones, computadores, acessórios e muito mais na SuperLoja!';
    $metaTags['keywords'] = 'eletrônicos Angola, tecnologia Luanda, smartphones, computadores, loja online Angola';
}

// Página de produto
elseif (preg_match('/^\/produto\/([^\/]+)$/', $path, $matches)) {
    $productSlug = $matches[1];
    
    try {
        $stmt = $pdo->prepare("
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.slug = ? AND p.active = 1
        ");
        $stmt->execute([$productSlug]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($product) {
            $metaTags['title'] = ($product['seo_title'] ?? $product['name']) . ' - SuperLoja Angola';
            $metaTags['description'] = $product['seo_description'] ?? 
                $product['description'] ?? 
                "Compre {$product['name']} na SuperLoja com o melhor preço de Angola.";
            $metaTags['keywords'] = $product['seo_keywords'] ?? 
                "{$product['name']}, {$product['category_name']}, Angola, eletrônicos";
            $metaTags['og_image'] = $product['og_image'] ?? $product['image_url'] ?? $defaultMeta['og_image'];
            $metaTags['canonical'] = "http://localhost:8080/produto/{$productSlug}";
            
            // Schema.org para produto
            $metaTags['schema'] = [
                '@context' => 'https://schema.org',
                '@type' => 'Product',
                'name' => $product['name'],
                'description' => $product['description'],
                'image' => $product['image_url'],
                'offers' => [
                    '@type' => 'Offer',
                    'price' => $product['price'],
                    'priceCurrency' => 'AOA',
                    'availability' => $product['in_stock'] ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
                ],
                'brand' => [
                    '@type' => 'Brand',
                    'name' => 'SuperLoja'
                ]
            ];
        }
    } catch (PDOException $e) {
        // Manter meta tags padrão se não encontrar produto
    }
}

// Página de categoria
elseif (preg_match('/^\/categoria\/([^\/]+)$/', $path, $matches)) {
    $categorySlug = $matches[1];
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ?");
        $stmt->execute([$categorySlug]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($category) {
            $metaTags['title'] = $category['name'] . ' - SuperLoja Angola';
            $metaTags['description'] = $category['description'] ?? 
                "Explore nossa seleção de {$category['name']} com os melhores preços de Angola.";
            $metaTags['keywords'] = "{$category['name']}, Angola, eletrônicos, SuperLoja";
            $metaTags['canonical'] = "http://localhost:8080/categoria/{$categorySlug}";
        }
    } catch (PDOException $e) {
        // Manter meta tags padrão se não encontrar categoria
    }
}

// Página de catálogo
elseif ($path === '/catalogo') {
    $metaTags['title'] = 'Catálogo de Produtos - SuperLoja Angola';
    $metaTags['description'] = 'Explore nosso catálogo completo de produtos tecnológicos com os melhores preços de Angola. Smartphones, computadores, acessórios e muito mais!';
    $metaTags['keywords'] = 'catálogo, produtos, eletrônicos, Angola, SuperLoja';
    $metaTags['canonical'] = 'http://localhost:8080/catalogo';
}

// Configurações padrão do site
try {
    $stmt = $pdo->prepare("SELECT * FROM settings WHERE id = 1");
    $stmt->execute();
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($settings) {
        if (isset($settings['store_name'])) {
            $metaTags['site_name'] = $settings['store_name'];
        }
        if (isset($settings['favicon_url']) && $settings['favicon_url']) {
            $metaTags['favicon'] = $settings['favicon_url'];
        }
        if (isset($settings['logo_url']) && $settings['logo_url']) {
            $metaTags['og_image'] = $settings['logo_url'];
        }
    }
} catch (PDOException $e) {
    // Usar configurações padrão se não conseguir carregar do banco
}

echo json_encode($metaTags, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
