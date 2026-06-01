<?php

declare(strict_types=1);

/**
 * Catálogo activo para el asistente (API en Render).
 */
function loadActiveProducts(): array
{
    $baseUrl = rtrim(
        function_exists('envValue')
            ? (envValue('API_BASE_URL') ?? 'https://coroto-backend.onrender.com')
            : 'https://coroto-backend.onrender.com',
        '/'
    );

    $body = fetchCatalogJson($baseUrl . '/productos');
    if ($body === null) {
        return [];
    }

    $items = json_decode($body, true);
    if (!is_array($items)) {
        return [];
    }

    $products = [];

    foreach ($items as $product) {
        if (!is_array($product)) {
            continue;
        }

        if (isset($product['activo']) && $product['activo'] === false) {
            continue;
        }

        $stock = (int) ($product['cantidad'] ?? $product['stock'] ?? 0);
        if ($stock <= 0) {
            continue;
        }

        $products[] = [
            'id'          => (string) ($product['id'] ?? ''),
            'name'        => (string) ($product['nombre'] ?? $product['name'] ?? ''),
            'brand'       => (string) ($product['brand'] ?? ''),
            'price'       => (int) ($product['precio'] ?? $product['price'] ?? 0),
            'status'      => (string) ($product['status'] ?? ''),
            'stock'       => $stock,
            'category'    => (string) ($product['categoria'] ?? $product['category'] ?? ''),
            'description' => (string) ($product['descripcion'] ?? $product['description'] ?? ''),
        ];
    }

    usort($products, static fn (array $a, array $b): int => $a['price'] <=> $b['price']);

    return $products;
}

function fetchCatalogJson(string $url): ?string
{
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($body === false || $status < 200 || $status >= 300) {
            return null;
        }

        return $body;
    }

    $context = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'header'  => "Accept: application/json\r\n",
            'timeout' => 15,
        ],
    ]);

    $body = @file_get_contents($url, false, $context);

    return $body === false ? null : $body;
}

function formatCop(int $amount): string
{
    return '$' . number_format($amount, 0, ',', '.');
}

function catalogPromptBlock(array $products): string
{
    if ($products === []) {
        return 'CATÁLOGO: (vacío o no disponible — pide al usuario recargar más tarde).';
    }

    $lines = ["CATÁLOGO ACTUAL (solo estos productos existen):"];

    foreach ($products as $p) {
        $brand = $p['brand'] !== '' ? $p['brand'] : '—';
        $description = function_exists('mb_substr')
            ? mb_substr($p['description'], 0, 120)
            : substr($p['description'], 0, 120);

        $lines[] = sprintf(
            '- id=%s | %s (%s) | %s | %s | stock=%d | %s',
            $p['id'],
            $p['name'],
            $brand,
            $p['category'],
            formatCop($p['price']),
            $p['stock'],
            $description
        );
    }

    return implode("\n", $lines);
}
