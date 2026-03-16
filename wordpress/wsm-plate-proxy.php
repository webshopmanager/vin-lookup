<?php
/**
 * Plugin Name: WSM Plate Lookup Proxy
 * Description: Proxies license plate lookups to Plate2VIN. API key stays server-side.
 * Version: 1.0.0
 */

define('WSM_PLATE2VIN_URL', 'https://platetovin.com/api/convert');
define('WSM_PLATE2VIN_KEY', 'TfE0aKdcx89cPonA8A7iN4bj4IfSZoKat4M1sZzGLXoyyST06qZAUv2PuzUH');

add_action('rest_api_init', function () {
    register_rest_route('wsm/v1', '/plate-lookup', [
        'methods'             => 'POST',
        'callback'            => 'wsm_plate_lookup',
        'permission_callback' => '__return_true',
    ]);
});

function wsm_plate_lookup($request) {
    $plate = strtoupper(trim($request['plate'] ?? ''));
    $state = strtoupper(trim($request['state'] ?? ''));

    if (!$plate || !$state) {
        return new WP_REST_Response(['error' => 'Both plate and state are required.'], 400);
    }

    $response = wp_remote_post(WSM_PLATE2VIN_URL, [
        'timeout' => 10,
        'headers' => [
            'Content-Type'  => 'application/json',
            'Authorization' => WSM_PLATE2VIN_KEY,
        ],
        'body' => json_encode(['plate' => $plate, 'state' => $state]),
    ]);

    if (is_wp_error($response)) {
        return new WP_REST_Response(['error' => 'Plate lookup service unavailable.'], 502);
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);

    // Check for credit errors
    $msg = $data['message'] ?? $data['error'] ?? '';
    if (stripos($msg, 'credit') !== false || stripos($msg, 'balance') !== false) {
        return new WP_REST_Response(['error' => 'no_credits'], 402);
    }

    // Extract VIN — Plate2VIN returns vin as string or nested object
    $vin = null;
    if (isset($data['vin'])) {
        $vin = is_array($data['vin']) ? ($data['vin']['vin'] ?? null) : $data['vin'];
    }

    if (!$vin) {
        return new WP_REST_Response(['error' => 'No vehicle found for that plate.'], 404);
    }

    return new WP_REST_Response(['vin' => $vin]);
}
