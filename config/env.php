<?php

declare(strict_types=1);

function loadEnv(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        [$name, $value] = array_pad(explode('=', $line, 2), 2, '');
        $name = trim($name);
        $value = trim($value);

        if ($name === '') {
            continue;
        }

        $first = $value[0] ?? '';
        $last = $value !== '' ? substr($value, -1) : '';

        if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
            $value = substr($value, 1, -1);
        }

        $_ENV[$name] = $value;
        putenv("{$name}={$value}");
    }
}

function envValue(string $name, ?string $default = null): ?string
{
    $value = $_ENV[$name] ?? getenv($name);

    if ($value === false || $value === '') {
        return $default;
    }

    return (string) $value;
}
