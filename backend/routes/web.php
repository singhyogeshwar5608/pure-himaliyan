<?php

use Illuminate\Support\Facades\Route;
use App\Models\Product;

Route::get('/', function () {
    return response()->json([
        'name' => 'Pure Himalyan Laravel API',
        'message' => 'Backend is running',
    ]);
});

Route::get('/sitemap.xml', function () {
    $products = Product::where('is_active', true)->get(['slug', 'updated_at']);

    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    $staticPages = [
        ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'weekly'],
        ['loc' => '/products', 'priority' => '0.9', 'changefreq' => 'weekly'],
        ['loc' => '/gallery', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['loc' => '/blog', 'priority' => '0.8', 'changefreq' => 'weekly'],
        ['loc' => '/privacy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['loc' => '/terms', 'priority' => '0.4', 'changefreq' => 'yearly'],
    ];

    foreach ($staticPages as $page) {
        $xml .= '<url>';
        $xml .= '<loc>' . url($page['loc']) . '</loc>';
        $xml .= '<priority>' . $page['priority'] . '</priority>';
        $xml .= '<changefreq>' . $page['changefreq'] . '</changefreq>';
        $xml .= '</url>';
    }

    foreach ($products as $product) {
        $xml .= '<url>';
        $xml .= '<loc>' . url('/products/' . $product->slug) . '</loc>';
        $xml .= '<priority>0.8</priority>';
        $xml .= '<changefreq>weekly</changefreq>';
        if ($product->updated_at) {
            $xml .= '<lastmod>' . $product->updated_at->format('Y-m-d') . '</lastmod>';
        }
        $xml .= '</url>';
    }

    $xml .= '</urlset>';

    return response($xml, 200, ['Content-Type' => 'application/xml']);
});
