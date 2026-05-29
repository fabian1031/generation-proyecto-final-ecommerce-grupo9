<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/site.php';
require_once __DIR__ . '/../config/catalog.php';

loadEnv(__DIR__ . '/../.env');

const GEMINI_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
];

function systemPrompt(array $products): string
{
    $facts = implode("\n", array_map(static fn (string $fact): string => '- ' . $fact, SITE_CHAT_FACTS));
    $catalog = catalogPromptBlock($products);
    $brand = SITE_PROFILE['brand'];
    $tagline = SITE_PROFILE['tagline'];

    return <<<PROMPT
Eres el asistente de compras de {$brand}, tienda colombiana de hardware. {$tagline}. Responde siempre en español, tono cercano y profesional.

Objetivo principal:
- Ayudar al cliente a elegir productos según su presupuesto, necesidad (gaming, oficina, upgrade GPU/CPU, etc.) y categoría.
- Comparar opciones del catálogo con precios en COP.
- Cuando el usuario confirme agregar al carrito, emitir la acción técnica indicada abajo.

Estilo:
- Respuestas claras, 2 a 6 frases; listas cortas si ayudan.
- Menciona precios en formato colombiano (ej. \$1.400.000).
- 1 a 2 emojis útiles como máximo.
- Texto plano, sin markdown ni asteriscos para negritas.

Presupuesto:
- Pregunta o usa el presupuesto que el usuario indique.
- Suma precios de productos recomendados y avisa si se pasa del presupuesto.
- Prioriza productos activos con stock del catálogo.

Carrito (MUY IMPORTANTE):
- NUNCA agregues al carrito sin confirmación explícita del usuario (sí, agrégalo, confirmo, dale, listo, etc.).
- Cuando confirme agregar al carrito, responde ÚNICAMENTE con la(s) línea(s) técnica(s), SIN texto adicional.
- Formato exacto (dos corchetes de cierre): [[CART_ADD:{"id":"ID_DEL_PRODUCTO","qty":1}]]
- Varios productos: una línea [[CART_ADD:...]] por cada uno. Nada más en ese mensaje.
- No escribas explicaciones junto a la etiqueta; la app muestra el mensaje al usuario.
- La app muestra al usuario el mensaje de confirmación; no repitas "agregado al carrito" ni despedidas.
- Usa solo IDs del catálogo. Para recomendar o conversar, NO uses [[CART_ADD]].

Datos del negocio:
{$facts}

{$catalog}
PROMPT;
}

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    $data = json_decode($rawBody ?: '', true);

    return is_array($data) ? $data : [];
}

function normalizeMessages(array $messages): array
{
    $normalized = [];

    foreach (array_slice($messages, -8) as $message) {
        if (!is_array($message)) {
            continue;
        }

        $role = $message['role'] ?? '';
        $content = trim((string) ($message['content'] ?? ''));

        if (!in_array($role, ['user', 'assistant'], true) || $content === '') {
            continue;
        }

        $safeContent = function_exists('mb_substr')
            ? mb_substr($content, 0, 4000)
            : substr($content, 0, 4000);

        $normalized[] = [
            'role' => $role === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $safeContent]],
        ];
    }

    return $normalized;
}

function postJson(string $url, array $payload): array
{
    $encodedPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => $encodedPayload,
            CURLOPT_TIMEOUT        => 25,
        ]);

        $body = curl_exec($curl);
        $error = curl_error($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        return [$status, $body === false ? '' : $body, $error ?: null];
    }

    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => $encodedPayload,
            'timeout' => 25,
        ],
    ]);

    $body = file_get_contents($url, false, $context);
    $status = 0;

    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
            $status = (int) $matches[1];
            break;
        }
    }

    return [$status, $body === false ? '' : $body, $body === false ? 'No se pudo conectar con Gemini.' : null];
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método no permitido.'], 405);
}

$apiKey = envValue('GEMINI_API_KEY');
if ($apiKey === null) {
    jsonResponse(['error' => 'El asistente no está configurado.'], 503);
}

$request = readJsonBody();
$contents = normalizeMessages($request['messages'] ?? []);

if ($contents === []) {
    jsonResponse(['error' => 'Escribe un mensaje para continuar.'], 422);
}

$products = loadActiveProducts();

$payload = [
    'systemInstruction' => [
        'parts' => [['text' => systemPrompt($products)]],
    ],
    'contents' => $contents,
    'generationConfig' => [
        'maxOutputTokens' => 512,
        'temperature'     => 0.35,
    ],
];

function friendlyApiError(string $lastError, int $lastStatus): string
{
    if ($lastStatus === 429 || preg_match('/quota|exceeded|resource_exhausted|rate.?limit|frecuencia|frequency/i', $lastError)) {
        return 'Alcanzaste el límite de frecuencia del plan gratuito de Gemini (por minuto o por día). '
            . 'Espera 1–2 minutos sin enviar más mensajes. '
            . 'Revisa tu cupo en Google AI Studio → Uso → Límites de frecuencia. '
            . 'El límite diario se renueva a medianoche (hora del Pacífico).';
    }

    if ($lastStatus === 403 || preg_match('/API key not valid|permission|forbidden/i', $lastError)) {
        return 'La clave GEMINI_API_KEY en .env no es válida o no tiene permisos. Revísala en Google AI Studio.';
    }

    if ($lastError !== '' && strlen($lastError) < 280) {
        return $lastError;
    }

    return 'El asistente no está disponible en este momento. Intenta de nuevo en unos minutos.';
}

$lastError = '';
$lastStatus = 0;

foreach (GEMINI_MODELS as $model) {
    $url = sprintf(
        'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
        rawurlencode($model),
        rawurlencode($apiKey)
    );

    [$status, $body, $transportError] = postJson($url, $payload);
    $data = json_decode($body, true);
    $apiError = is_array($data) ? (string) ($data['error']['message'] ?? '') : '';
    $lastError = $transportError ?: $apiError ?: 'HTTP ' . $status;
    $lastStatus = $status;

    if ($status >= 200 && $status < 300 && isset($data['candidates'][0]['content']['parts'])) {
        $reply = '';
        foreach ($data['candidates'][0]['content']['parts'] as $part) {
            $reply .= (string) ($part['text'] ?? '');
        }
        jsonResponse(['reply' => trim($reply) ?: 'Sin respuesta.']);
    }

    $retry = $status === 404
        || $status === 429
        || preg_match('/quota|exceeded|resource_exhausted|rate.?limit|not found/i', $apiError);

    if ($retry) {
        continue;
    }

    break;
}

jsonResponse(['error' => friendlyApiError($lastError, $lastStatus)], 502);
