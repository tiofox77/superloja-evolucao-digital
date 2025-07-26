<?php
declare(strict_types=1);

header('Content-Type: application/xml; charset=utf-8');

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
    echo '<?xml version="1.0" encoding="UTF-8"?><error>Database connection failed</error>';
    exit;
}

$baseUrl = 'http://localhost:8080';
$currentDate = date('Y-m-d');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Página inicial
echo "  <url>\n";
echo "    <loc>{$baseUrl}/</loc>\n";
echo "    <lastmod>{$currentDate}</lastmod>\n";
echo "    <changefreq>daily</changefreq>\n";
echo "    <priority>1.0</priority>\n";
echo "  </url>\n";

// Páginas estáticas
$staticPages = [
    '/catalogo' => ['changefreq' => 'daily', 'priority' => '0.9'],
    '/categorias' => ['changefreq' => 'weekly', 'priority' => '0.8'],
    '/leiloes' => ['changefreq' => 'daily', 'priority' => '0.7'],
    '/solicitar-produto' => ['changefreq' => 'monthly', 'priority' => '0.6'],
    '/sobre' => ['changefreq' => 'monthly', 'priority' => '0.5'],
    '/contato' => ['changefreq' => 'monthly', 'priority' => '0.5'],
    '/faq' => ['changefreq' => 'monthly', 'priority' => '0.4'],
    '/termos-uso' => ['changefreq' => 'yearly', 'priority' => '0.3'],
    '/politica-privacidade' => ['changefreq' => 'yearly', 'priority' => '0.3'],
    '/politica-devolucao' => ['changefreq' => 'yearly', 'priority' => '0.3']
];

foreach ($staticPages as $page => $config) {
    echo "  <url>\n";
    echo "    <loc>{$baseUrl}{$page}</loc>\n";
    echo "    <lastmod>{$currentDate}</lastmod>\n";
    echo "    <changefreq>{$config['changefreq']}</changefreq>\n";
    echo "    <priority>{$config['priority']}</priority>\n";
    echo "  </url>\n";
}

// Produtos ativos
try {
    $stmt = $pdo->prepare("
        SELECT slug, updated_at, created_at 
        FROM products 
        WHERE active = 1 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($products as $product) {
        $lastmod = $product['updated_at'] ? date('Y-m-d', strtotime($product['updated_at'])) : 
                   date('Y-m-d', strtotime($product['created_at']));
        
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}/produto/{$product['slug']}</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        echo "  </url>\n";
    }
} catch (PDOException $e) {
    // Continuar sem produtos se houver erro
}

// Categorias
try {
    $stmt = $pdo->prepare("
        SELECT slug, updated_at, created_at 
        FROM categories 
        WHERE active = 1 
        ORDER BY name
    ");
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($categories as $category) {
        $lastmod = $category['updated_at'] ? date('Y-m-d', strtotime($category['updated_at'])) : 
                   date('Y-m-d', strtotime($category['created_at']));
        
        echo "  <url>\n";
        echo "    <loc>{$baseUrl}/categoria/{$category['slug']}</loc>\n";
        echo "    <lastmod>{$lastmod}</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.7</priority>\n";
        echo "  </url>\n";
    }
} catch (PDOException $e) {
    // Continuar sem categorias se houver erro
}

echo "</urlset>\n";
?>
