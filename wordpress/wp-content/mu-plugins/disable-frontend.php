<?php
/**
 * Plugin Name: Disable WordPress Frontend
 * Description: Redirects all frontend requests to admin or API. WordPress is headless only.
 */

add_action('template_redirect', function () {
    // Allow REST API
    if (defined('REST_REQUEST') && REST_REQUEST) return;

    // Allow admin
    if (is_admin()) return;

    // Allow login page
    if (in_array($GLOBALS['pagenow'], ['wp-login.php', 'wp-register.php'])) return;

    // Allow AJAX
    if (wp_doing_ajax()) return;

    // Allow cron
    if (wp_doing_cron()) return;

    // Redirect everything else to admin
    wp_redirect(admin_url(), 302);
    exit;
});
