<?php
/**
 * Fighters Custom Post Type (mirrors API-Sports data)
 */

add_action('init', function () {
    register_post_type('fighter', [
        'labels' => [
            'name' => 'Fighters',
            'singular_name' => 'Fighter',
            'add_new' => 'Add Fighter',
            'add_new_item' => 'Add New Fighter',
            'edit_item' => 'Edit Fighter',
            'all_items' => 'All Fighters',
        ],
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'rest_base' => 'fighter',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'],
        'menu_icon' => 'dashicons-superhero',
        'rewrite' => ['slug' => 'fighters'],
    ]);
});

add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) return;

    acf_add_local_field_group([
        'key' => 'group_fighter_fields',
        'title' => 'Fighter Data',
        'fields' => [
            ['key' => 'field_fighter_api_id', 'label' => 'API ID', 'name' => 'fighter_api_id', 'type' => 'number'],
            ['key' => 'field_fighter_category', 'label' => 'Category', 'name' => 'category', 'type' => 'text'],
            ['key' => 'field_fighter_team', 'label' => 'Team Name', 'name' => 'team_name', 'type' => 'text'],
            ['key' => 'field_fighter_nickname', 'label' => 'Nickname', 'name' => 'nickname', 'type' => 'text'],
            ['key' => 'field_fighter_height', 'label' => 'Height', 'name' => 'height', 'type' => 'text'],
            ['key' => 'field_fighter_weight', 'label' => 'Weight', 'name' => 'weight', 'type' => 'text'],
            ['key' => 'field_fighter_reach', 'label' => 'Reach', 'name' => 'reach', 'type' => 'text'],
            ['key' => 'field_fighter_stance', 'label' => 'Stance', 'name' => 'stance', 'type' => 'text'],
            ['key' => 'field_record_wins', 'label' => 'Wins', 'name' => 'record_wins', 'type' => 'number'],
            ['key' => 'field_record_losses', 'label' => 'Losses', 'name' => 'record_losses', 'type' => 'number'],
            ['key' => 'field_record_draws', 'label' => 'Draws', 'name' => 'record_draws', 'type' => 'number'],
            ['key' => 'field_fighter_photo_cdn', 'label' => 'Photo CDN URL', 'name' => 'photo_cdn', 'type' => 'url'],
            ['key' => 'field_fighter_last_synced', 'label' => 'Last Synced', 'name' => 'last_synced', 'type' => 'text'],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'fighter']]],
        'show_in_rest' => true,
    ]);
});

// Register meta for REST API queries
add_action('init', function () {
    register_post_meta('fighter', 'fighter_api_id', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'integer',
    ]);
});
