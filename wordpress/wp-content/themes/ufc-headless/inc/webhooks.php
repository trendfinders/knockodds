<?php
/**
 * Webhooks - Trigger ISR revalidation on content changes
 */

// Trigger revalidation when posts are published/updated
add_action('save_post', function ($post_id, $post, $update) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
    if ($post->post_status !== 'publish') return;

    $frontend_url = defined('FRONTEND_URL') ? FRONTEND_URL : 'http://localhost:3000';
    $secret = defined('REVALIDATION_SECRET') ? REVALIDATION_SECRET : '';

    $paths_to_revalidate = ['/'];

    switch ($post->post_type) {
        case 'news':
            $paths_to_revalidate[] = '/news';
            $paths_to_revalidate[] = '/news/' . $post->post_name;
            break;
        case 'fighter':
            $api_id = get_field('fighter_api_id', $post_id);
            $paths_to_revalidate[] = '/fighters';
            if ($api_id) $paths_to_revalidate[] = '/fighters/' . $api_id;
            break;
        case 'fight':
            $api_id = get_field('fight_api_id', $post_id);
            $paths_to_revalidate[] = '/fights';
            if ($api_id) $paths_to_revalidate[] = '/fights/' . $api_id;
            $paths_to_revalidate[] = '/odds';
            break;
        case 'pronostic':
            $paths_to_revalidate[] = '/pronostics';
            $paths_to_revalidate[] = '/pronostics/' . $post->post_name;
            break;
    }

    // Fire and forget - don't block the save
    wp_remote_post($frontend_url . '/api/revalidate', [
        'body' => wp_json_encode([
            'secret' => $secret,
            'paths' => $paths_to_revalidate,
        ]),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 5,
        'blocking' => false,
    ]);
}, 10, 3);

// Clear transients on post save
add_action('save_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id)) return;

    switch ($post->post_type) {
        case 'fight':
            delete_transient('ufc_upcoming_fights_5');
            delete_transient('ufc_upcoming_fights_10');
            break;
        case 'pronostic':
            delete_transient('ufc_latest_pronostics_5');
            delete_transient('ufc_latest_pronostics_10');
            break;
        case 'fighter':
            $api_id = get_field('fighter_api_id', $post_id);
            if ($api_id) delete_transient('ufc_fighter_full_' . $api_id);
            break;
    }
}, 10, 2);
