<?php
/**
 * Fights Custom Post Type
 */

add_action('init', function () {
    register_post_type('fight', [
        'labels' => [
            'name' => 'Fights',
            'singular_name' => 'Fight',
            'add_new' => 'Add Fight',
            'add_new_item' => 'Add New Fight',
            'edit_item' => 'Edit Fight',
            'all_items' => 'All Fights',
        ],
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'rest_base' => 'fight',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'],
        'menu_icon' => 'dashicons-awards',
        'rewrite' => ['slug' => 'fights'],
    ]);
});

add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) return;

    acf_add_local_field_group([
        'key' => 'group_fight_fields',
        'title' => 'Fight Data',
        'fields' => [
            ['key' => 'field_fight_api_id', 'label' => 'Fight API ID', 'name' => 'fight_api_id', 'type' => 'number'],
            ['key' => 'field_fight_event_slug', 'label' => 'Event Slug', 'name' => 'event_slug', 'type' => 'text'],
            ['key' => 'field_fight_date', 'label' => 'Fight Date', 'name' => 'fight_date', 'type' => 'text'],
            ['key' => 'field_fight_category', 'label' => 'Category', 'name' => 'category', 'type' => 'text'],
            ['key' => 'field_fight_fighter1_id', 'label' => 'Fighter 1 API ID', 'name' => 'fighter1_id', 'type' => 'number'],
            ['key' => 'field_fight_fighter2_id', 'label' => 'Fighter 2 API ID', 'name' => 'fighter2_id', 'type' => 'number'],
            ['key' => 'field_fight_status', 'label' => 'Status', 'name' => 'status', 'type' => 'select',
                'choices' => ['NS' => 'Not Started', 'LIVE' => 'Live', 'FT' => 'Finished', 'CANC' => 'Cancelled', 'PST' => 'Postponed']],
            ['key' => 'field_fight_is_main', 'label' => 'Is Main Event', 'name' => 'is_main', 'type' => 'true_false'],
            ['key' => 'field_fight_odds_data', 'label' => 'Odds Data (JSON)', 'name' => 'odds_data', 'type' => 'textarea'],
            ['key' => 'field_fight_result_data', 'label' => 'Result Data (JSON)', 'name' => 'result_data', 'type' => 'textarea'],
            ['key' => 'field_fight_last_synced', 'label' => 'Last Synced', 'name' => 'last_synced', 'type' => 'text'],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'fight']]],
        'show_in_rest' => true,
    ]);
});

add_action('init', function () {
    register_post_meta('fight', 'fight_api_id', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'integer',
    ]);
    register_post_meta('fight', 'fight_date', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
    ]);
});
