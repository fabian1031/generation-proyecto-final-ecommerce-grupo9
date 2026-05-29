<?php

declare(strict_types=1);

/**
 * Catálogo activo para el asistente (sincronizado con development/db.json).
 */
function loadActiveProducts(): array
{
    $dbPath = dirname(__DIR__) . '/development/db.json';

    if (!is_readable($dbPath)) {
        return [];
    }

    $raw = file_get_contents($dbPath);
    $data = json_decode($raw ?: '', true);

    if (!is_array($data) || !isset($data['products']) || !is_array($data['products'])) {
        return [];
    }

    $products = [];

    foreach ($data['products'] as $product) {
        if (!is_array($product)) {
            continue;
        }

        if (isset($product['isActive']) && $product['isActive'] === false) {
            continue;
        }

        $stock = (int) ($product['stock'] ?? 0);
        if ($stock <= 0) {
            continue;
        }

        $products[] = [
            'id'          => (string) ($product['id'] ?? ''),
            'name'        => (string) ($product['name'] ?? ''),
            'brand'       => (string) ($product['brand'] ?? ''),
            'price'       => (int) ($product['price'] ?? 0),
            'status'      => (string) ($product['status'] ?? ''),
            'stock'       => $stock,
            'category'    => (string) ($product['category'] ?? ''),
            'description' => (string) ($product['description'] ?? ''),
        ];
    }

    usort($products, static fn (array $a, array $b): int => $a['price'] <=> $b['price']);

    return $products;
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
        $lines[] = sprintf(
            '- id=%s | %s (%s) | %s | %s | stock=%d | %s',
            $p['id'],
            $p['name'],
            $p['brand'],
            $p['category'],
            formatCop($p['price']),
            $p['stock'],
            mb_substr($p['description'], 0, 120)
        );
    }

    return implode("\n", $lines);
}
