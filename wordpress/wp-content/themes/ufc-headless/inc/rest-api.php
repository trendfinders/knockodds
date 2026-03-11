<?php
/**
 * Custom REST API Endpoints
 */

add_action('rest_api_init', function () {
    // Upcoming fights (ordered by date, status NS only)
    register_rest_route('ufc/v1', '/upcoming-fights', [
        'methods' => 'GET',
        'callback' => 'ufc_get_upcoming_fights',
        'permission_callback' => '__return_true',
        'args' => [
            'per_page' => ['default' => 10, 'sanitize_callback' => 'absint'],
        ],
    ]);

    // Latest pronostics with fight data
    register_rest_route('ufc/v1', '/latest-pronostics', [
        'methods' => 'GET',
        'callback' => 'ufc_get_latest_pronostics',
        'permission_callback' => '__return_true',
        'args' => [
            'per_page' => ['default' => 5, 'sanitize_callback' => 'absint'],
        ],
    ]);

    // Full fighter data (WP post + API data combined)
    register_rest_route('ufc/v1', '/fighter/(?P<api_id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ufc_get_fighter_full',
        'permission_callback' => '__return_true',
    ]);

    // Bookmaker review by slug
    register_rest_route('ufc/v1', '/bookmaker-review/(?P<slug>[a-z0-9-]+)', [
        'methods' => 'GET',
        'callback' => 'ufc_get_bookmaker_review',
        'permission_callback' => '__return_true',
    ]);

    // Site navigation settings (header + footer)
    register_rest_route('ufc/v1', '/site-settings', [
        'methods' => 'GET',
        'callback' => 'ufc_get_site_settings',
        'permission_callback' => '__return_true',
    ]);

    // ISR Revalidation trigger
    register_rest_route('ufc/v1', '/revalidate', [
        'methods' => 'POST',
        'callback' => 'ufc_trigger_revalidation',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ]);
});

function ufc_get_upcoming_fights($request) {
    $per_page = $request->get_param('per_page');
    $now = current_time('mysql', true);

    $cache_key = 'ufc_upcoming_fights_' . $per_page;
    $cached = get_transient($cache_key);
    if ($cached !== false) return rest_ensure_response($cached);

    $query = new WP_Query([
        'post_type' => 'fight',
        'posts_per_page' => $per_page,
        'meta_key' => 'fight_date',
        'orderby' => 'meta_value',
        'order' => 'ASC',
        'meta_query' => [
            ['key' => 'fight_date', 'value' => $now, 'compare' => '>=', 'type' => 'DATETIME'],
            ['key' => 'status', 'value' => ['NS', 'PST'], 'compare' => 'IN'],
        ],
    ]);

    $fights = [];
    foreach ($query->posts as $post) {
        $fights[] = [
            'id' => $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'fight_api_id' => (int) get_field('fight_api_id', $post->ID),
            'event_slug' => get_field('event_slug', $post->ID),
            'fight_date' => get_field('fight_date', $post->ID),
            'category' => get_field('category', $post->ID),
            'fighter1_id' => (int) get_field('fighter1_id', $post->ID),
            'fighter2_id' => (int) get_field('fighter2_id', $post->ID),
            'is_main' => (bool) get_field('is_main', $post->ID),
            'odds_data' => json_decode(get_field('odds_data', $post->ID) ?: '{}'),
        ];
    }

    set_transient($cache_key, $fights, 60);
    return rest_ensure_response($fights);
}

function ufc_get_latest_pronostics($request) {
    $per_page = $request->get_param('per_page');

    $cache_key = 'ufc_latest_pronostics_' . $per_page;
    $cached = get_transient($cache_key);
    if ($cached !== false) return rest_ensure_response($cached);

    $query = new WP_Query([
        'post_type' => 'pronostic',
        'posts_per_page' => $per_page,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);

    $pronostics = [];
    foreach ($query->posts as $post) {
        $pronostics[] = [
            'id' => $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'excerpt' => get_the_excerpt($post),
            'fight_api_id' => (int) get_field('fight_api_id', $post->ID),
            'predicted_winner_id' => (int) get_field('predicted_winner_id', $post->ID),
            'confidence' => (int) get_field('confidence', $post->ID),
            'predicted_method' => get_field('predicted_method', $post->ID),
            'date' => $post->post_date,
        ];
    }

    set_transient($cache_key, $pronostics, 300);
    return rest_ensure_response($pronostics);
}

function ufc_get_fighter_full($request) {
    $api_id = (int) $request['api_id'];

    $cache_key = 'ufc_fighter_full_' . $api_id;
    $cached = get_transient($cache_key);
    if ($cached !== false) return rest_ensure_response($cached);

    $query = new WP_Query([
        'post_type' => 'fighter',
        'meta_key' => 'fighter_api_id',
        'meta_value' => $api_id,
        'posts_per_page' => 1,
    ]);

    if (!$query->have_posts()) {
        return new WP_Error('not_found', 'Fighter not found', ['status' => 404]);
    }

    $post = $query->posts[0];
    $data = [
        'id' => $post->ID,
        'api_id' => $api_id,
        'name' => $post->post_title,
        'slug' => $post->post_name,
        'bio' => $post->post_content,
        'excerpt' => get_the_excerpt($post),
        'nickname' => get_field('nickname', $post->ID),
        'category' => get_field('category', $post->ID),
        'team_name' => get_field('team_name', $post->ID),
        'height' => get_field('height', $post->ID),
        'weight' => get_field('weight', $post->ID),
        'reach' => get_field('reach', $post->ID),
        'stance' => get_field('stance', $post->ID),
        'record' => [
            'wins' => (int) get_field('record_wins', $post->ID),
            'losses' => (int) get_field('record_losses', $post->ID),
            'draws' => (int) get_field('record_draws', $post->ID),
        ],
        'photo_cdn' => get_field('photo_cdn', $post->ID),
        'last_synced' => get_field('last_synced', $post->ID),
    ];

    set_transient($cache_key, $data, 3600);
    return rest_ensure_response($data);
}

function ufc_trigger_revalidation($request) {
    $frontend_url = defined('FRONTEND_URL') ? FRONTEND_URL : 'http://localhost:3000';
    $secret = defined('REVALIDATION_SECRET') ? REVALIDATION_SECRET : '';

    $response = wp_remote_post($frontend_url . '/api/revalidate', [
        'body' => wp_json_encode([
            'secret' => $secret,
            'paths' => $request->get_param('paths') ?? ['/'],
        ]),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        return new WP_Error('revalidation_failed', $response->get_error_message());
    }

    return rest_ensure_response(['success' => true]);
}

function ufc_get_bookmaker_review($request) {
    $slug = sanitize_text_field($request['slug']);

    $cache_key = 'ufc_bm_review_' . $slug;
    $cached = get_transient($cache_key);
    if ($cached !== false) return rest_ensure_response($cached);

    $query = new WP_Query([
        'post_type' => 'bookmaker_review',
        'meta_key' => 'bookmaker_slug',
        'meta_value' => $slug,
        'posts_per_page' => 1,
    ]);

    if (!$query->have_posts()) {
        return rest_ensure_response(null);
    }

    $post = $query->posts[0];
    $data = [
        'id' => $post->ID,
        'bookmaker_slug' => get_post_meta($post->ID, 'bookmaker_slug', true),
        'seo_title' => get_post_meta($post->ID, 'seo_title', true),
        'meta_description' => get_post_meta($post->ID, 'meta_description', true),
        'custom_h1' => get_post_meta($post->ID, 'custom_h1', true),
        'intro_text' => get_post_meta($post->ID, 'intro_text', true),
        'review_h2' => get_post_meta($post->ID, 'review_h2', true),
        'review_content' => get_post_meta($post->ID, 'review_content', true),
        'pros' => array_filter(array_map('trim', explode("\n", get_post_meta($post->ID, 'pros', true) ?: ''))),
        'cons' => array_filter(array_map('trim', explode("\n", get_post_meta($post->ID, 'cons', true) ?: ''))),
        'verdict_text' => get_post_meta($post->ID, 'verdict_text', true),
        'cta_text' => get_post_meta($post->ID, 'cta_text', true),
        'rating' => (float) get_post_meta($post->ID, 'rating', true),
        'featured_image_url' => get_post_meta($post->ID, 'featured_image_url', true),
    ];

    set_transient($cache_key, $data, 3600);
    return rest_ensure_response($data);
}

function ufc_get_site_settings() {
    $cache_key = 'ufc_site_settings';
    $cached = get_transient($cache_key);
    if ($cached !== false) return rest_ensure_response($cached);

    $data = [
        'header_nav' => json_decode(get_option('knockodds_header_nav', '[]'), true) ?: [],
        'footer_col1' => json_decode(get_option('knockodds_footer_col1', '{}'), true) ?: null,
        'footer_col2' => json_decode(get_option('knockodds_footer_col2', '{}'), true) ?: null,
        'footer_col3' => json_decode(get_option('knockodds_footer_col3', '{}'), true) ?: null,
        'footer_disclaimer' => get_option('knockodds_footer_disclaimer', ''),
    ];

    set_transient($cache_key, $data, 300);
    return rest_ensure_response($data);
}
