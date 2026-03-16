<?php
/**
 * Plate2VIN proxy — keeps API key server-side.
 *
 * Drop this file into the WSM webroot or route to it.
 * POST /api/wsm-plate-lookup
 * Body: { "plate": "ABC1234", "state": "TX" }
 * Returns: { "vin": "1FMCU9J98MUA12345" }
 */

header('Content-Type: application/json');

// --- Config ---
// Set your Plate2VIN API key here, or load from environment.
$apiKey = getenv('PLATE2VIN_API_KEY') ?: 'TfE0aKdcx89cPonA8A7iN4bj4IfSZoKat4M1sZzGLXoyyST06qZAUv2PuzUH';

// Demo mode: set to true to return canned VINs without hitting Plate2VIN.
$demoMode = getenv('PLATE2VIN_DEMO_MODE') === 'true';

$demoVins = [
    '1HGCM82633A004352', // 2003 Honda Accord
    '1FMEE5DPXMLA66891', // 2021 Ford Bronco
    '1G1ZT53826F109149', // 2006 Chevrolet Malibu
    'JN8AZ2NE5C9012345', // 2012 Nissan Pathfinder
    'WBA3A5C51DF359218', // 2013 BMW 3 Series
];

// --- Only accept POST ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// --- Parse body ---
$body = json_decode(file_get_contents('php://input'), true);
$plate = isset($body['plate']) ? strtoupper(trim($body['plate'])) : '';
$state = isset($body['state']) ? strtoupper(trim($body['state'])) : '';

if (!$plate || !$state) {
    http_response_code(400);
    echo json_encode(['error' => 'Both plate and state are required.']);
    exit;
}

if (strlen($plate) < 2 || strlen($plate) > 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid plate number.']);
    exit;
}

// --- Demo mode ---
if ($demoMode) {
    $seed = array_sum(array_map('ord', str_split($plate . $state)));
    $vin = $demoVins[$seed % count($demoVins)];
    echo json_encode(['vin' => $vin, 'demo' => true]);
    exit;
}

// --- Check API key ---
if (!$apiKey) {
    http_response_code(503);
    echo json_encode(['error' => 'not_configured']);
    exit;
}

// --- Call Plate2VIN ---
$ch = curl_init('https://platetovin.com/api/convert');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode(['plate' => $plate, 'state' => $state]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'Plate lookup service unavailable.']);
    exit;
}

$data = json_decode($response, true);

// Check for credit errors
$msg = isset($data['message']) ? $data['message'] : (isset($data['error']) ? $data['error'] : '');
if (stripos($msg, 'credit') !== false || stripos($msg, 'balance') !== false) {
    http_response_code(402);
    echo json_encode(['error' => 'no_credits', 'message' => $msg]);
    exit;
}

// Extract VIN — Plate2VIN returns vin as string or nested object
$vin = null;
if (isset($data['vin'])) {
    $vin = is_array($data['vin']) ? (isset($data['vin']['vin']) ? $data['vin']['vin'] : null) : $data['vin'];
}

if ($httpCode >= 400 || !$vin) {
    http_response_code(404);
    echo json_encode(['error' => isset($data['message']) ? $data['message'] : 'No vehicle found for that plate.']);
    exit;
}

echo json_encode(['vin' => $vin]);
