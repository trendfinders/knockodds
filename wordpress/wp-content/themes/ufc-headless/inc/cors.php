<?php
/**
 * CORS Configuration for Headless Frontend
 */

add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $allowed_origins = [
            'http://localhost:3000',
            'https://knockodds.com',
            'https://www.knockodds.com',
        ];

        $origin = get_http_origin();

        if (in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 600');
        }

        return $value;
    });
}, 15);

// Handle preflight OPTIONS requests
add_action('init', function () {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $allowed_origins = [
            'http://localhost:3000',
            'https://knockodds.com',
            'https://www.knockodds.com',
        ];

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Max-Age: 600');
            header('Content-Length: 0');
            header('Content-Type: text/plain');
            exit(0);
        }
    }
});
