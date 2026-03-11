<?php
/**
 * UFC Headless Theme - Functions
 * Minimal headless WordPress theme for MMA platform
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Theme setup
add_action('after_setup_theme', function () {
    add_theme_support('post-thumbnails');
    add_theme_support('title-tag');
    add_theme_support('custom-logo');
});

// Include modules
require_once get_template_directory() . '/inc/cpt-news.php';
require_once get_template_directory() . '/inc/cpt-fighters.php';
require_once get_template_directory() . '/inc/cpt-fights.php';
require_once get_template_directory() . '/inc/cpt-pronostics.php';
require_once get_template_directory() . '/inc/cpt-bookmaker-reviews.php';
require_once get_template_directory() . '/inc/rest-api.php';
require_once get_template_directory() . '/inc/site-settings.php';
require_once get_template_directory() . '/inc/cors.php';
require_once get_template_directory() . '/inc/webhooks.php';

// Disable default WordPress frontend features not needed for headless
add_action('init', function () {
    // Remove emoji scripts
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');

    // Remove oEmbed
    remove_action('wp_head', 'wp_oembed_add_discovery_links');

    // Remove REST API link from header (security)
    remove_action('wp_head', 'rest_output_link_wp_head');
    remove_action('wp_head', 'wp_oembed_add_host_js');
});

// Expose ACF fields in REST API for all custom post types
add_filter('acf/settings/rest_api_format', function () {
    return 'standard';
});

// Increase REST API default per_page limit
add_filter('rest_endpoints', function ($endpoints) {
    foreach ($endpoints as $route => $endpoint) {
        foreach ($endpoint as $key => $args) {
            if (is_array($args) && isset($args['args']['per_page'])) {
                $endpoints[$route][$key]['args']['per_page']['maximum'] = 100;
            }
        }
    }
    return $endpoints;
});
